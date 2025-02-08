/**
 * Validates if a string is a valid iCal URL
 * @param url URL to validate
 * @returns true if URL is valid, false otherwise
 */
export function isValidICalUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Tests if an iCal URL is accessible and returns valid iCal data
 * @param url URL to test
 * @returns Object with success status and message
 */
export async function testICalUrl(url: string): Promise<{ success: boolean; message: string }> {
  if (!isValidICalUrl(url)) {
    return { success: false, message: 'Invalid URL format' };
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return { 
        success: false, 
        message: `Failed to fetch calendar (${response.status}: ${response.statusText})`
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/calendar')) {
      return {
        success: false,
        message: 'URL does not return iCal data'
      };
    }

    // Read first few lines to check if it's valid iCal
    const text = await response.text();
    if (!text.includes('BEGIN:VCALENDAR')) {
      return {
        success: false,
        message: 'Invalid iCal format'
      };
    }

    return { success: true, message: 'Calendar URL is valid' };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to fetch calendar: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
