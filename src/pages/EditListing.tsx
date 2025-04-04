
import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEditListing } from "@/hooks/useEditListing";
import BasicDetailsTab from "@/components/edit-listing/BasicDetailsTab";
import RoomDetailsTab from "@/components/edit-listing/RoomDetailsTab";
import FloorPlanTab from "@/components/edit-listing/floor-plan/FloorPlanTab";
import OpenHouseTab from "@/components/edit-listing/open-house/OpenHouseTab";
import PhotoManagementTab from "@/components/edit-listing/photo-management/PhotoManagementTab";
import ListingNumberDisplay from "@/components/property/ListingNumberDisplay";
import { OpenHouseProvider } from "@/contexts/OpenHouseContext";
import PropertyNotFound from "@/components/property/PropertyNotFound";
import { createLogger } from "@/utils/logger";

const logger = createLogger("EditListing");

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get tab from URL query or default to "basic"
  const tabFromQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromQuery || "basic");
  const [errorLoading, setErrorLoading] = useState<boolean>(false);
  
  const {
    form,
    isLoading,
    isSaving,
    bedroomRooms,
    setBedroomRooms,
    otherRooms,
    setOtherRooms,
    floorPlans,
    setFloorPlans,
    saveProperty,
    propertyDetails,
    error
  } = useEditListing(id);

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    logger.info("EditListing: Tab changed to:", newTab);
    setActiveTab(newTab);
    searchParams.set("tab", newTab);
    setSearchParams(searchParams);
  };

  // Add debug logging
  useEffect(() => {
    logger.info("EditListing: Rendered with activeTab:", activeTab);
    logger.info("EditListing: propertyId:", id);
    
    // Check for error after initial loading
    if (error) {
      logger.error("EditListing: Error loading property:", error);
      setErrorLoading(true);
    }
  }, [activeTab, id, error]);

  const onSubmit = form.handleSubmit((data) => {
    logger.info("EditListing: Main form submitted with data:", data);
    saveProperty(data);
  });

  // Show property not found if there was an error loading the property
  if (errorLoading) {
    return <PropertyNotFound errorType="edit-not-found" propertyId={id} />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-center">
              <p className="text-lg font-medium text-gray-500">Loading property data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Improved navigation handler that uses React Router's navigate
  const handleCancel = () => {
    logger.info("EditListing: Cancel button clicked");
    if (id) {
      navigate(`/property/${id}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to={`/property/${id}`} className="text-zen-blue-500 hover:text-zen-blue-600">
            &larr; Back to Property
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Property Listing</h1>
          {propertyDetails?.listingNumber && (
            <ListingNumberDisplay 
              listingNumber={propertyDetails.listingNumber} 
              listingStatus={form.watch("status")}
            />
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
            <TabsTrigger value="rooms">Room Details</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="floorPlans">Floor Plans</TabsTrigger>
            <TabsTrigger value="openHouse">Open House</TabsTrigger>
          </TabsList>
          
          {/* Conditional rendering based on active tab */}
          {activeTab !== "openHouse" && activeTab !== "photos" ? (
            <Form {...form}>
              <form onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }} className="space-y-6">
                <TabsContent value="basic">
                  <BasicDetailsTab form={form} />
                </TabsContent>
                
                <TabsContent value="rooms">
                  <RoomDetailsTab 
                    bedroomRooms={bedroomRooms}
                    setBedroomRooms={setBedroomRooms}
                    otherRooms={otherRooms}
                    setOtherRooms={setOtherRooms}
                    bedroomCount={form.watch("bedrooms")}
                  />
                </TabsContent>

                <TabsContent value="floorPlans">
                  <FloorPlanTab
                    floorPlans={floorPlans}
                    setFloorPlans={setFloorPlans}
                    propertyId={id}
                  />
                </TabsContent>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Update Listing"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : activeTab === "photos" ? (
            <TabsContent value="photos">
              <PhotoManagementTab propertyId={id} />
              
              <div className="flex justify-end space-x-4 pt-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={() => handleTabChange("basic")}
                >
                  Back to Basic Details
                </Button>
              </div>
            </TabsContent>
          ) : (
            <TabsContent value="openHouse">
              <OpenHouseProvider propertyId={id}>
                <OpenHouseTab propertyId={id} />
                
                <div className="flex justify-end space-x-4 pt-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => handleTabChange("basic")}
                  >
                    Back to Basic Details
                  </Button>
                </div>
              </OpenHouseProvider>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
