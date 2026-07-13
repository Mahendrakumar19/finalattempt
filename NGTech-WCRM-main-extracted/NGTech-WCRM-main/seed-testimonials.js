const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const seoTestimonials = [
  {
    nameMatch: 'BIT, Gaya',
    testimonial_text: "Implementing NGTech WCRM revolutionized our admissions process. We've seen a 300% increase in student engagement using their official Meta WhatsApp API integration. It's the best WhatsApp CRM for educational institutions in India.",
    author_name: 'Dr. Amit Sharma',
    author_role: 'Director of Admissions'
  },
  {
    nameMatch: 'NGTech',
    testimonial_text: "Using our own WhatsApp CRM has allowed our internal teams to scale sales effortlessly. The shared team inbox and automated AI chatbot features are absolute game-changers for B2B SaaS lead generation.",
    author_name: 'Sandeep Kumar',
    author_role: 'Founder & CEO'
  },
  {
    nameMatch: 'BPTIA',
    testimonial_text: "As a trade association, communicating with thousands of members was a nightmare until we found NGTech WCRM. The seamless Meta verification process and bulk broadcasting capabilities via the WhatsApp API have transformed our operations.",
    author_name: 'Ravi Verma',
    author_role: 'Secretary General'
  }
];

const fallbackTestimonial = {
  testimonial_text: "NGTech WCRM is hands down the most reliable WhatsApp Business API platform we have used. The customer support, robust automation, and transparent pricing have helped us scale our customer support operations securely.",
  author_name: 'Priya Desai',
  author_role: 'Head of Customer Experience'
};

async function main() {
  console.log('Fetching clients...');
  const { data: clients, error } = await supabase.from('saas_trusted_clients').select('*');
  
  if (error) {
    console.error('Error fetching clients:', error);
    return;
  }
  
  console.log(`Found ${clients.length} clients.`);
  
  for (const client of clients) {
    let updateData = seoTestimonials.find(t => client.name.includes(t.nameMatch));
    
    if (!updateData) {
      updateData = {
        ...fallbackTestimonial,
        author_role: `VP of Operations, ${client.name}` // Make it dynamic
      };
    }
    
    console.log(`Updating ${client.name} with testimonial from ${updateData.author_name}...`);
    
    const { error: updateError } = await supabase
      .from('saas_trusted_clients')
      .update({
        testimonial_text: updateData.testimonial_text,
        author_name: updateData.author_name,
        author_role: updateData.author_role
      })
      .eq('id', client.id);
      
    if (updateError) {
      console.error(`Failed to update ${client.name}:`, updateError);
    } else {
      console.log(`Successfully updated ${client.name}.`);
    }
  }
  console.log('All done!');
}

main();
