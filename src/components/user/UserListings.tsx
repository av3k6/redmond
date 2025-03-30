
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Plus, Loader2, Calendar, Clock } from "lucide-react";
import PropertyCard from "@/components/property/PropertyCard";
import { PropertyListing, ListingStatus } from "@/types";
import ShowingRequestManager from "./showings/ShowingRequestManager";
import SellerAvailabilityManager from "./showings/SellerAvailabilityManager";

const UserListings = () => {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<string>("listings");
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<PropertyListing[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return;
      
      console.log("Fetching listings for user:", user.id, user.email);
      
      try {
        setIsLoading(true);
        
        // First try to get listings from property_listings table
        let { data, error } = await supabase
          .from("property_listings")
          .select("*");
          
        if (error) {
          console.log("Error fetching all listings:", error.message);
          setListings([]);
          setIsLoading(false);
          return;
        }
        
        // Log all listings for debugging
        console.log("All listings found:", data?.length || 0);
        
        if (data && data.length > 0) {
          // Check for any seller_id inconsistencies
          console.log("Sample listing seller_ids:", data.slice(0, 3).map(l => ({ 
            id: l.id, 
            seller_id: l.seller_id,
            email: l.seller_email
          })));
        }
        
        // Now filter by seller email as fallback if ID doesn't match
        let userListings;
        if (data) {
          userListings = data.filter(listing => 
            listing.seller_id === user.id || 
            listing.seller_email === user.email
          );
          
          console.log("Filtered listings for this user:", userListings.length);
        } else {
          userListings = [];
        }

        // Transform the raw data to match PropertyListing type
        const formattedListings = userListings ? userListings.map(listing => ({
          id: listing.id,
          title: listing.title || "Untitled Property",
          description: listing.description || "",
          price: listing.price || 0,
          address: listing.address || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
          },
          propertyType: listing.property_type || "house",
          bedrooms: listing.bedrooms || 0,
          bathrooms: listing.bathrooms || 0,
          squareFeet: listing.square_feet || 0,
          yearBuilt: listing.year_built || 0,
          features: listing.features || [],
          images: listing.images || [],
          sellerId: listing.seller_id,
          // Convert the status string to a valid ListingStatus enum value
          status: (listing.status as ListingStatus) || ListingStatus.ACTIVE,
          createdAt: new Date(listing.created_at),
          updatedAt: new Date(listing.updated_at),
        })) as PropertyListing[] : [];

        setListings(formattedListings);
      } catch (err) {
        console.error("Unexpected error while fetching listings:", err);
        // Set empty listings instead of showing an error
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [user, supabase, toast]);

  const handleCreateListing = () => {
    navigate("/sell");
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Property Management</CardTitle>
          <CardDescription>Manage your listings and showings</CardDescription>
        </div>
        <Button onClick={handleCreateListing}>
          <Plus className="h-4 w-4 mr-2" /> New Listing
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Your Listings</span>
            </TabsTrigger>
            <TabsTrigger value="showings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Showing Requests</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Availability</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="listings">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You don't have any property listings yet.</p>
                <Button onClick={handleCreateListing} variant="outline">
                  Create Your First Listing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="relative">
                    <PropertyCard property={listing} />
                    <div className="absolute top-2 right-2 z-10">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-8 px-2"
                        onClick={() => navigate(`/property/${listing.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="showings">
            <ShowingRequestManager isBuyer={false} />
          </TabsContent>
          
          <TabsContent value="availability">
            <SellerAvailabilityManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserListings;
