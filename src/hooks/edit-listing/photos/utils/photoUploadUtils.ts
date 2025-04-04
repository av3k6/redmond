
import { SupabaseClient } from "@supabase/supabase-js";
import { createLogger } from "@/utils/logger";
import { BUCKET_NAME } from "./bucketUtils";
import { validatePhotoFile } from "./photoValidationUtils";

const logger = createLogger("photoUploadUtils");

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads a single photo file to storage
 * @param supabase Supabase client instance
 * @param file File to upload
 * @param propertyId ID of the property
 * @returns Upload result with URL if successful
 */
export const uploadPhotoFile = async (
  supabase: SupabaseClient, 
  file: File, 
  propertyId: string
): Promise<UploadResult> => {
  try {
    // Validate the file first
    const validationResult = validatePhotoFile(file);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.error
      };
    }

    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    logger.info(`Uploading file: ${fileName}`);
    
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type,
      });
    
    if (uploadError) {
      logger.error("Storage upload error:", uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`
      };
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);
    
    if (!urlData?.publicUrl) {
      logger.error("Failed to get public URL");
      return {
        success: false,
        error: "Failed to get public URL for uploaded file"
      };
    }
    
    logger.info("Public URL obtained:", urlData.publicUrl);
    
    return {
      success: true,
      url: urlData.publicUrl
    };
  } catch (error) {
    logger.error("Error uploading photo file:", error);
    return {
      success: false,
      error: `Unexpected error: ${String(error)}`
    };
  }
};

/**
 * Saves photo metadata to the database
 * @param supabase Supabase client instance
 * @param propertyId ID of the property
 * @param url Public URL of the uploaded photo
 * @param displayOrder Display order of the photo
 * @param isPrimary Whether this is the primary photo
 * @returns Boolean indicating success or failure
 */
export const savePhotoRecord = async (
  supabase: SupabaseClient,
  propertyId: string,
  url: string,
  displayOrder: number,
  isPrimary: boolean
): Promise<boolean> => {
  try {
    const { error: dbError } = await supabase
      .from('property_photos')
      .insert({
        property_id: propertyId,
        url: url,
        display_order: displayOrder,
        is_primary: isPrimary
      });
    
    if (dbError) {
      logger.error('Database error adding photo record:', dbError);
      return false;
    }
    
    logger.info(`Successfully saved photo record with order ${displayOrder}`);
    return true;
  } catch (error) {
    logger.error("Error saving photo record:", error);
    return false;
  }
};
