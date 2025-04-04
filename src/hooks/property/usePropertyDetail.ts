
import { useState, useEffect } from "react";
import { PropertyListing, ListingStatus } from "@/types";
import { useSupabase } from "@/hooks/useSupabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createLogger } from "@/utils/logger";
import { isPropertyOwner } from "@/utils/propertyOwnershipUtils";
import { mockListings } from "@/data/mockData";

const logger = createLogger("usePropertyDetail");

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const usePropertyDetail = (propertyId: string | undefined) => {
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<'not-found' | 'invalid-id' | 'no-permission' | null>(null);
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        setErrorType('not-found');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // First check mock data (for demo purposes)
      const mockProperty = mockListings.find((listing) => listing.id === propertyId);
      
      if (mockProperty) {
        // If listing is pending and user is not the owner, don't display it
        if (mockProperty.status === ListingStatus.PENDING && 
            mockProperty.sellerId !== user?.id && 
            !user?.isAdmin) {
          setProperty(null);
          setErrorType('no-permission');
          setIsLoading(false);
          return;
        }
        
        logger.info("Found property in mock data:", { id: propertyId, title: mockProperty.title });
        setProperty(mockProperty);
        setIsLoading(false);
        return;
      }
      
      // If not found in mock data, try to fetch from Supabase
      try {
        // Only validate UUID if we're fetching from Supabase database
        // This allows non-UUID format IDs for mock data
        if (!isValidUUID(propertyId)) {
          logger.info("Non-UUID format property ID:", propertyId);
          setProperty(null);
          setErrorType('not-found');
          setIsLoading(false);
          return;
        }
        
        logger.info("Fetching property from Supabase:", propertyId);
        
        // First, try to fetch from property_listings table
        let propertyData = null;
        const { data, error } = await supabase
          .from("property_listings")
          .select("*")
          .eq("id", propertyId)
          .single();
          
        if (error) {
          logger.error("Error fetching property:", error);
          
          // Try an alternative query using seller_email instead of seller_id
          if (user) {
            logger.info("Attempting to find property with user email:", user.email);
            const { data: emailData, error: emailError } = await supabase
              .from("property_listings")
              .select("*")
              .eq("seller_email", user.email)
              .eq("id", propertyId)
              .single();
              
            if (emailError || !emailData) {
              setProperty(null);
              setErrorType('not-found');
              setIsLoading(false);
              return;
            }
            
            // If we found a property by email, use that
            propertyData = emailData;
            logger.info("Found property using seller_email match:", propertyId);
          } else {
            setProperty(null);
            setErrorType('not-found');
            setIsLoading(false);
            return;
          }
        } else {
          // Use the data from the first query
          propertyData = data;
        }
        
        // If we found a property, check if we need to fetch photos from property_photos table
        if (propertyData) {
          // ENHANCEMENT: Check if we should fetch images from property_photos table
          try {
            logger.info("Fetching photos from property_photos table");
            const { data: photoData, error: photoError } = await supabase
              .from('property_photos')
              .select('*')
              .eq('property_id', propertyId)
              .order('display_order', { ascending: true });
              
            if (!photoError && photoData && photoData.length > 0) {
              logger.info(`Found ${photoData.length} photos in property_photos table`);
              // Override the images array from property_listings with photos from property_photos
              const photoUrls = photoData.map(photo => photo.url);
              propertyData.images = photoUrls;
            } else {
              logger.info("No photos found in property_photos or error occurred:", photoError);
            }
          } catch (photoFetchError) {
            logger.error("Error fetching from property_photos:", photoFetchError);
            // Continue with existing images if any
          }
          
          logger.info("Found property in database:", { id: propertyId, title: propertyData.title });
          
          // Check if listing is pending and user is not the owner
          // When checking ownership, check both seller_id and seller_email
          const isOwner = isPropertyOwner(propertyData, user?.id, user?.email);
            
          if (propertyData.status === ListingStatus.PENDING && 
              !isOwner && 
              !user?.isAdmin) {
            setProperty(null);
            setErrorType('no-permission');
            setIsLoading(false);
            return;
          }
          
          // Transform the raw data to match PropertyListing type
          const formattedProperty: PropertyListing = {
            id: propertyData.id,
            title: propertyData.title,
            description: propertyData.description,
            price: propertyData.price,
            address: propertyData.address,
            propertyType: propertyData.property_type,
            bedrooms: propertyData.bedrooms,
            bathrooms: propertyData.bathrooms,
            squareFeet: propertyData.square_feet,
            yearBuilt: propertyData.year_built,
            features: propertyData.features || [],
            images: propertyData.images || [],
            sellerId: propertyData.seller_id || user?.id || "",  // Fallback to current user ID if missing
            status: propertyData.status,
            createdAt: new Date(propertyData.created_at),
            updatedAt: new Date(propertyData.updated_at),
            roomDetails: {
              ...propertyData.room_details,
              listingNumber: propertyData.listing_number
            }
          };
          
          setProperty(formattedProperty);
        } else {
          setProperty(null);
          setErrorType('not-found');
        }
      } catch (err) {
        logger.error("Failed to fetch property:", err);
        toast({
          title: "Error",
          description: "Failed to load property details",
          variant: "destructive",
        });
        setProperty(null);
        setErrorType('not-found');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProperty();
  }, [propertyId, supabase, toast, user]);

  return {
    property,
    isLoading,
    errorType
  };
};
