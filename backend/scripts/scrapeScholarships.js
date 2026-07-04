require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const Scholarship = require('../models/Scholarship');

const MOCK_SCHOLARSHIPS = [
  {
    title: "Prime Minister's Scholarship Scheme",
    provider: "Ministry of Defence",
    amount: "₹2,500/month",
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
    category: "Merit",
    eligibility: "Children of ex-servicemen, min 60% in Class 12",
    description: "Financial assistance to the dependent wards / widows of ex-servicemen.",
    applyUrl: "https://www.buddy4study.com/scholarship/prime-ministers-scholarship-scheme",
    source: "mock",
  },
  {
    title: "Inspire Scholarship",
    provider: "DST Government of India",
    amount: "₹80,000/year",
    deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 4 months
    category: "Merit",
    eligibility: "Top 1% in Class 12 board exams, pursuing BSc/Integrated MSc",
    description: "Innovation in Science Pursuit for Inspired Research (INSPIRE) scheme.",
    applyUrl: "https://online-inspire.gov.in/",
    source: "mock",
  },
  {
    title: "Sitaram Jindal Foundation Scholarship",
    provider: "Sitaram Jindal Foundation",
    amount: "₹1,500-4,000/month",
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 2 months
    category: "Need-based",
    eligibility: "Students from low-income families, min 50% marks",
    description: "Merit-cum-means scholarship for students pursuing various courses.",
    applyUrl: "https://www.sitaramjindalfoundation.org/scholarships.php",
    source: "mock",
  },
  {
    title: "ONGC Merit Scholarship",
    provider: "ONGC Foundation",
    amount: "₹48,000/year",
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 1.5 months
    category: "Minority",
    eligibility: "SC/ST/OBC students pursuing professional courses (Engineering, Medical)",
    description: "Scholarship for candidates belonging to marginalized communities.",
    applyUrl: "https://ongcscholar.org/",
    source: "mock",
  },
  {
    title: "Tata Trusts Medical and Healthcare Scholarships",
    provider: "Tata Trusts",
    amount: "Partial to full tuition",
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    category: "Other",
    eligibility: "Undergraduate and postgraduate medical students",
    description: "Financial assistance for students pursuing medical studies in India.",
    applyUrl: "https://www.tatatrusts.org/our-work/individual-grants-initiative/education-grants",
    source: "mock",
  },
  {
    title: "Reliance Foundation Undergraduate Scholarships",
    provider: "Reliance Foundation",
    amount: "Up to ₹2,000,000 over degree",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    category: "Merit",
    eligibility: "Top 5000 rankers in JEE/NEET or equivalent exams",
    description: "Empowering the youth of India to pursue undergraduate education.",
    applyUrl: "https://scholarships.reliancefoundation.org/",
    source: "mock",
  },
  {
    title: "HDFC Educational Crisis Scholarship Support",
    provider: "HDFC Bank",
    amount: "₹10,000 to ₹25,000",
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
    category: "Need-based",
    eligibility: "Students facing personal or economic crisis",
    description: "Support for students to continue their education without interruption.",
    applyUrl: "https://www.hdfcbank.com/personal/about-us/csr/ecss",
    source: "mock",
  },
  {
    title: "National Fellowship and Scholarship for Higher Education of ST Students",
    provider: "Ministry of Tribal Affairs",
    amount: "Full tuition, living expenses",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
    category: "Minority",
    eligibility: "ST students pursuing higher education (MPhil, PhD)",
    description: "Financial assistance to tribal students for higher education.",
    applyUrl: "https://tribal.nic.in/education.aspx",
    source: "mock",
  },
  {
    title: "KVPY (Kishore Vaigyanik Protsahan Yojana)",
    provider: "Department of Science and Technology",
    amount: "₹5,000 - ₹7,000/month",
    deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
    category: "Research",
    eligibility: "Class 11 to 1st year UG pursuing basic sciences",
    description: "National level fellowship to encourage students to take up research careers in science.",
    applyUrl: "http://kvpy.iisc.ernet.in/",
    source: "mock",
  },
  {
    title: "Women in STEM Scholarship",
    provider: "British Council",
    amount: "Full tuition, living, travel",
    deadline: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000), // ~6.5 months
    category: "International",
    eligibility: "Women pursuing Master's in STEM in the UK",
    description: "Supporting women from South Asia to pursue STEM degrees.",
    applyUrl: "https://www.britishcouncil.in/study-uk/scholarships/women-stem-scholarships",
    source: "mock",
  },
  {
    title: "AICTE Pragati Scholarship for Girls",
    provider: "AICTE",
    amount: "₹50,000/year",
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days
    category: "Merit",
    eligibility: "Girl students admitted to first year of Degree/Diploma courses",
    description: "Empowering girls through technical education.",
    applyUrl: "https://www.aicte-india.org/schemes/students-development-schemes/Pragati",
    source: "mock",
  },
  {
    title: "Sports Authority of India (SAI) Scholarship",
    provider: "Sports Authority of India",
    amount: "₹6,000 - ₹18,000/year",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
    category: "Sports",
    eligibility: "National and state-level sports medalists",
    description: "Financial support to encourage sporting talent in India.",
    applyUrl: "https://sportsauthorityofindia.nic.in/sai/",
    source: "mock",
  },
  {
    title: "Kotak Kanya Scholarship",
    provider: "Kotak Education Foundation",
    amount: "Up to ₹1.5 Lakh/year",
    deadline: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000), // ~2.5 months
    category: "Need-based",
    eligibility: "Girls from low-income families pursuing professional graduation courses",
    description: "Supporting meritorious girl students from underprivileged sections.",
    applyUrl: "https://kotakeducation.org/",
    source: "mock",
  },
  {
    title: "Ramanujan Fellowship",
    provider: "SERB, Gov. of India",
    amount: "₹1,35,000/month",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    category: "Research",
    eligibility: "Indian researchers returning from abroad",
    description: "Fellowship for brilliant Indian scientists returning to India.",
    applyUrl: "https://serb.gov.in/ramanujan.php",
    source: "mock",
  },
  {
    title: "Global Korea Scholarship (GKS)",
    provider: "Govt of South Korea",
    amount: "Full tuition, living, airfare",
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days
    category: "International",
    eligibility: "Indian students applying for UG/PG programs in South Korea",
    description: "Promoting international exchange in education.",
    applyUrl: "https://www.studyinkorea.go.kr/",
    source: "mock",
  }
];

async function insertMockData() {
  console.log('Inserting mock scholarships as fallback...');
  const ops = MOCK_SCHOLARSHIPS.map(sch => ({
    updateOne: {
      filter: { title: sch.title, provider: sch.provider },
      update: { $set: sch },
      upsert: true
    }
  }));
  const result = await Scholarship.bulkWrite(ops);
  console.log(`Fallback complete. Upserted ${result.upsertedCount} new mock scholarships, Modified ${result.modifiedCount}.`);
}

async function scrapeBuddy4Study() {
  let browser;
  try {
    console.log('Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    console.log('Navigating to buddy4study scholarships page...');
    await page.goto('https://www.buddy4study.com/scholarships', { waitUntil: 'networkidle2', timeout: 30000 });

    // Try to wait for the main listing container. If this fails, the site structure has changed.
    await page.waitForSelector('article', { timeout: 10000 }); 

    const rawScholarships = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('article');
      
      cards.forEach(card => {
        try {
            const titleEl = card.querySelector('h3, h4, .title');
            const providerEl = card.querySelector('.provider, .org, p');
            const linkEl = card.querySelector('a');

            if (titleEl && linkEl) {
                results.push({
                    title: titleEl.innerText.trim(),
                    provider: providerEl ? providerEl.innerText.trim() : 'Unknown Provider',
                    applyUrl: linkEl.href,
                    source: 'buddy4study',
                    category: 'Other'
                });
            }
        } catch(e) {}
      });
      return results;
    });

    console.log(`Found ${rawScholarships.length} scholarships on main page. Attempting to fetch details...`);

    if (rawScholarships.length === 0) {
      throw new Error('No scholarships found. Selector might be outdated.');
    }

    const finalScholarships = [];

    // Only do a few to avoid taking too long or getting rate-limited during the task execution
    const limit = Math.min(rawScholarships.length, 5); 

    for (let i = 0; i < limit; i++) {
        const sch = rawScholarships[i];
        try {
            console.log(`Fetching details for: ${sch.title}`);
            const detailPage = await browser.newPage();
            await detailPage.goto(sch.applyUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            
            // Try to extract some details. This is highly dependent on Buddy4Study's specific HTML structure
            const details = await detailPage.evaluate(() => {
                let amount = "Variable";
                let eligibility = "Check official website";
                let description = "";
                let deadline = null;

                try {
                   // Buddy4Study often has sections or list items with these keywords
                   const textContent = document.body.innerText.toLowerCase();
                   
                   // Crude extraction, real scraping requires precise selectors
                   if (textContent.includes('eligibility')) {
                      eligibility = "Eligibility details available on site.";
                   }
                } catch(e) {}
                
                return { amount, eligibility, description, deadline };
            });

            finalScholarships.push({
                ...sch,
                amount: details.amount,
                eligibility: details.eligibility,
                description: details.description || sch.title,
                // Setting deadline to +30 days if null
                deadline: details.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });

            await detailPage.close();
            // Sleep 1.5 seconds
            await new Promise(res => setTimeout(res, 1500));
        } catch (e) {
            console.error(`Failed to fetch details for ${sch.title}`, e.message);
            // Still add it with basic info
            finalScholarships.push({
                ...sch,
                description: sch.title,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
        }
    }

    if (finalScholarships.length > 0) {
      console.log('Writing scraped scholarships to database...');
      const ops = finalScholarships.map(sch => ({
        updateOne: {
          filter: { title: sch.title, provider: sch.provider },
          update: { $set: sch },
          upsert: true
        }
      }));
      const result = await Scholarship.bulkWrite(ops);
      console.log(`Scraped ${finalScholarships.length} scholarships, saved ${result.upsertedCount} new, modified ${result.modifiedCount}.`);
    }

  } catch (error) {
    console.error('Puppeteer scraping failed:', error.message);
    console.log('Falling back to mock data...');
    await insertMockData();
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function run() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/budget_buddy_db';
    console.log(`Connecting to MongoDB at ${uri}`);
    await mongoose.connect(uri);
    
    await scrapeBuddy4Study();

  } catch (error) {
    console.error('Error running scraper:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

run();
