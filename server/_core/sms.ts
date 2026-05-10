import axios from 'axios';

const TEXTMAGIC_API_URL = 'https://rest.textmagic.com/api/v2';

interface SendSMSOptions {
  phone: string;
  message: string;
}

interface TextMagicResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS via TextMagic API
 */
export async function sendSMS(options: SendSMSOptions): Promise<TextMagicResponse> {
  try {
    const apiUser = process.env.TEXTMAGIC_API_USER;
    const apiKey = process.env.TEXTMAGIC_API_KEY;

    if (!apiUser || !apiKey) {
      throw new Error('TextMagic credentials not configured');
    }

    const response = await axios.post(
      `${TEXTMAGIC_API_URL}/messages`,
      {
        phones: options.phone,
        text: options.message,
      },
      {
        auth: {
          username: apiUser,
          password: apiKey,
        },
        timeout: 10000,
      }
    );

    // Log full response for debugging
    console.log('[SMS] TextMagic response status:', response.status);
    console.log('[SMS] TextMagic response data:', JSON.stringify(response.data));

    // TextMagic returns 200/201 with data containing 'id' on success
    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        messageId: response.data.id || response.data.messageId || response.data.sessionId,
      };
    }

    return {
      success: false,
      error: response.data?.error || `HTTP ${response.status}`,
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

/**
 * Check SMS balance
 */
export async function checkSMSBalance(): Promise<number | null> {
  try {
    const apiUser = process.env.TEXTMAGIC_API_USER;
    const apiKey = process.env.TEXTMAGIC_API_KEY;

    if (!apiUser || !apiKey) {
      throw new Error('TextMagic credentials not configured');
    }

    const response = await axios.get(`${TEXTMAGIC_API_URL}/user`, {
      auth: {
        username: apiUser,
        password: apiKey,
      },
      timeout: 10000,
    });

    return response.data?.balance || null;
  } catch (error) {
    console.error('Error checking SMS balance:', error);
    return null;
  }
}
