// backend/services/ocrService.js
const vision = require('@google-cloud/vision');

// Initialize client. Google Cloud Vision automatically picks up GOOGLE_APPLICATION_CREDENTIALS
const client = new vision.ImageAnnotatorClient();

/**
 * Extracts amount, date, and merchant from a receipt image URL using Google Cloud Vision.
 * @param {string} imageUrl - The Cloudinary URL of the uploaded receipt
 * @returns {Promise<Object>} Extracted data and confidence
 */
const extractReceiptData = async (imageUrl) => {
  console.log('[OCR] extractReceiptData called with URL:', imageUrl);
  try {
    const [result] = await client.textDetection(imageUrl);
    console.log('[OCR] Vision API returned successfully');
    const annotations = result.textAnnotations;
    
    if (!annotations || annotations.length === 0) {
      return {
        amount: null,
        date: null,
        merchant: null,
        rawText: '',
        confidence: 'low'
      };
    }

    const rawText = annotations[0].description;
    console.log('[OCR] Raw text extracted:', rawText.substring(0, 200));
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 1. Amount Parsing
    // Enhanced Regex for standard formats
    const amountRegex = /(?:₹|rs\.?|inr|total|amount|sum|pay|due)[\s:=-]*((?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?:\.[0-9]{1,2})?)/gi;
    let match;
    let maxAmount = 0;

    while ((match = amountRegex.exec(rawText)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (val > maxAmount) {
        maxAmount = val;
      }
    }

    // If no labeled amount found, just try to find the largest floating point number
    if (maxAmount === 0) {
      const allNumbersRegex = /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/g;
      let matchNum;
      while ((matchNum = allNumbersRegex.exec(rawText)) !== null) {
        // Exclude things that look like years or phone numbers if they are just simple integers without commas/decimals?
        // Actually, just find the largest number that could be an amount.
        const valStr = matchNum[1].replace(/,/g, '');
        const val = parseFloat(valStr);
        if (!isNaN(val) && val > maxAmount) {
           maxAmount = val;
        }
      }
    }
    
    const finalAmount = maxAmount > 0 ? maxAmount : null;
    console.log('[OCR] Extracted amount:', finalAmount);

    // 2. Date Parsing
    // DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY, MMM DD YYYY
    const dateRegexes = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY or MM/DD/YYYY
      /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i, // DD May 2026
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})[\s,]+(\d{4})/i // May 12 2026
    ];

    let parsedDate = null;
    for (const line of lines) {
      for (const regex of dateRegexes) {
        const m = regex.exec(line);
        if (m) {
          if (m.length === 4) {
            // Check which format matched
            if (/\d{1,2}/.test(m[1]) && /\d{1,2}/.test(m[2]) && /\d{4}/.test(m[3])) {
              // Assuming DD/MM/YYYY
              const day = m[1].padStart(2, '0');
              const month = m[2].padStart(2, '0');
              const year = m[3];
              parsedDate = `${year}-${month}-${day}`;
            } else if (/\d{1,2}/.test(m[1]) && /[a-z]+/i.test(m[2]) && /\d{4}/.test(m[3])) {
              // DD MMM YYYY
              const day = m[1].padStart(2, '0');
              const monthStr = m[2].substring(0, 3).toLowerCase();
              const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
              const month = months[monthStr];
              const year = m[3];
              if (month) parsedDate = `${year}-${month}-${day}`;
            } else if (/[a-z]+/i.test(m[1]) && /\d{1,2}/.test(m[2]) && /\d{4}/.test(m[3])) {
              // MMM DD YYYY
              const monthStr = m[1].substring(0, 3).toLowerCase();
              const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
              const month = months[monthStr];
              const day = m[2].padStart(2, '0');
              const year = m[3];
              if (month) parsedDate = `${year}-${month}-${day}`;
            }
          }
          if (parsedDate) break;
        }
      }
      if (parsedDate) break;
    }

    // 3. Merchant Parsing
    // First meaningful line, ignore TAX INVOICE, INVOICE, RECEIPT, BILL, GST
    const ignoreList = ['tax invoice', 'invoice', 'receipt', 'bill', 'gst', 'cash memo', 'retail invoice'];
    let merchant = null;
    for (const line of lines) {
      const lower = line.toLowerCase();
      // Skip if line is just a keyword or is a date or amount
      if (ignoreList.some(ignore => lower.includes(ignore))) {
        continue;
      }
      // Heuristic: If line contains a number, it's likely a date/time/amount, not a merchant (though some merchants have numbers, usually their names are purely letters or alphanumeric)
      // Actually, just picking the first non-ignored line is usually decent since the top line is often the store name.
      // But skip short lines
      if (line.length < 3) continue;
      
      merchant = line;
      break;
    }

    // Determine confidence
    let foundCount = 0;
    if (finalAmount) foundCount++;
    if (parsedDate) foundCount++;
    if (merchant) foundCount++;

    let confidence = 'low';
    if (foundCount === 3) confidence = 'high';
    else if (foundCount === 2) confidence = 'medium';

    const result_data = {
      amount: finalAmount,
      date: parsedDate,
      merchant,
      rawText,
      confidence
    };
    console.log('[OCR] Final result:', JSON.stringify({ amount: finalAmount, date: parsedDate, merchant, confidence }));
    return result_data;

  } catch (error) {
    console.error('OCR Extraction error:', error.message);
    return {
      amount: null,
      date: null,
      merchant: null,
      rawText: '',
      confidence: 'low'
    };
  }
};

module.exports = {
  extractReceiptData
};
