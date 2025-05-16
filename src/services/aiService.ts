import { GoogleGenAI, Schema, Type } from "@google/genai";

interface DocumentData {
  patient_details: {
    name: string;
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    contact_number?: string;
    address?: string;
  };
  claim_details: {
    claim_number: string;
    claim_date: string;
    claim_type: 'INPATIENT' | 'OUTPATIENT' | 'DAYCARE';
    diagnosis?: string;
    treatment_details?: string;
    admission_date?: string;
    discharge_date?: string;
    total_amount: number;
    currency: string;
  };
  hospital_details: {
    name: string;
    address: string;
    registration_number?: string;
  };
}

const GEMINI_CONFIG = {
  MODEL_NAME: 'gemini-2.0-flash',
  SYSTEM_PROMPT: `You are an AI assistant specialized in extracting medical information from documents.
Analyze the provided medical document and extract the following information in a structured JSON format.
If any information is not found in the document, use null for that field.
Be precise and accurate in your extraction.`,
};

const MEDICAL_CLAIM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    patient_details: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        age: { type: Type.NUMBER },
        gender: {
          type: Type.STRING,
          enum: ['MALE', 'FEMALE', 'OTHER']
        },
        contact_number: { type: Type.STRING },
        address: { type: Type.STRING }
      },
      required: ['name', 'age', 'gender']
    },
    claim_details: {
      type: Type.OBJECT,
      properties: {
        claim_number: { type: Type.STRING },
        claim_date: { type: Type.STRING },
        claim_type: {
          type: Type.STRING,
          enum: ['INPATIENT', 'OUTPATIENT', 'DAYCARE']
        },
        diagnosis: { type: Type.STRING },
        treatment_details: { type: Type.STRING },
        admission_date: { type: Type.STRING },
        discharge_date: { type: Type.STRING },
        total_amount: { type: Type.NUMBER },
        currency: { type: Type.STRING }
      },
      required: ['claim_number', 'claim_date', 'claim_type', 'total_amount']
    },
    hospital_details: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        address: { type: Type.STRING },
        registration_number: { type: Type.STRING }
      },
      required: ['name', 'address']
    }
  },
  required: ['patient_details', 'claim_details', 'hospital_details']
};

export class AIService {
  private genAI: GoogleGenAI;
  private modelName: string;
  private medicalClaimSchema: Schema;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not provided');
    }
    this.genAI = new GoogleGenAI({ apiKey });
    this.modelName = GEMINI_CONFIG.MODEL_NAME;
    this.medicalClaimSchema = MEDICAL_CLAIM_SCHEMA;
  }

  private async detectMimeType(base64String: string): Promise<string> {
    const signatures: { [key: string]: string } = {
      '/9j/': 'image/jpeg',
      'iVBORw0KGgo': 'image/png',
      'R0lGODlh': 'image/gif',
      'UklGRg==': 'image/webp',
      'JVBERi0': 'application/pdf'
    };

    for (const [signature, mimeType] of Object.entries(signatures)) {
      if (base64String.startsWith(signature)) {
        return mimeType;
      }
    }

    throw new Error('Unsupported file type');
  }

  private async extractTextFromDocument(base64String: string): Promise<DocumentData> {
    try {
      const mimeType = await this.detectMimeType(base64String);

      const prompt = `${GEMINI_CONFIG.SYSTEM_PROMPT}
      Please extract the information from the provided document.`;

      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64String
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: this.medicalClaimSchema
        }
      });

      const extractedData = JSON.parse(response.text || '{}');
      return extractedData as DocumentData;
    } catch (error) {
      console.error('Error extracting text from document:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  public async processDocument(base64String: string): Promise<DocumentData> {
    try {
      return await this.extractTextFromDocument(base64String);
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  public async processMultipleDocuments(base64Strings: string[]): Promise<DocumentData[]> {
    try {
      const results = await Promise.all(
        base64Strings.map(doc => this.processDocument(doc))
      );
      return results;
    } catch (error) {
      console.error('Error processing multiple documents:', error);
      throw error;
    }
  }
}