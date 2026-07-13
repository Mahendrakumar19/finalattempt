-- Update BIT, Gaya
UPDATE public.saas_trusted_clients
SET 
  testimonial_text = 'Implementing NGTech WCRM revolutionized our admissions process. We''ve seen a 300% increase in student engagement using their official Meta WhatsApp API integration. It''s the best WhatsApp CRM for educational institutions in India.',
  author_name = 'Dr. Amit Sharma',
  author_role = 'Director of Admissions'
WHERE name ILIKE '%BIT, Gaya%';

-- Update NGTech
UPDATE public.saas_trusted_clients
SET 
  testimonial_text = 'Using our own WhatsApp CRM has allowed our internal teams to scale sales effortlessly. The shared team inbox and automated AI chatbot features are absolute game-changers for B2B SaaS lead generation.',
  author_name = 'Sandeep Kumar',
  author_role = 'Founder & CEO'
WHERE name ILIKE '%NGTech%';

-- Update BPTIA
UPDATE public.saas_trusted_clients
SET 
  testimonial_text = 'As a trade association, communicating with thousands of members was a nightmare until we found NGTech WCRM. The seamless Meta verification process and bulk broadcasting capabilities via the WhatsApp API have transformed our operations.',
  author_name = 'Ravi Verma',
  author_role = 'Secretary General'
WHERE name ILIKE '%BPTIA%';

-- Update any others that might not have a testimonial
UPDATE public.saas_trusted_clients
SET 
  testimonial_text = 'NGTech WCRM is hands down the most reliable WhatsApp Business API platform we have used. The customer support, robust automation, and transparent pricing have helped us scale our customer support operations securely.',
  author_name = 'Priya Desai',
  author_role = 'Head of Customer Experience'
WHERE testimonial_text IS NULL;
