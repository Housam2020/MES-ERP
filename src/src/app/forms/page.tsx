"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from "@/utils/supabase/client";
// import { v4 as uuidv4 } from 'uuid';

type FormData = {
  email_address: string;
  full_name: string;
  contact_phone_number: string;
  role: string;
  budget_line: string;
  group_or_team_name: string;
  approved_individual_or_project_name: string;
  sport_and_team_name: string;
  conference_or_competition_name: string;
  conference_competition_type: string;
  head_delegate: boolean;
  reimbursement_or_payment: string;
  vendor_recipient: string;
  payment_description: string;
  payment_timeframe: string;
  preferred_payment_form: string;
  payment_details: string;
  amount_requested_cad: number;
  additional_payment_info: string;
  reimbursement_payable_to: string;
  total_claimed_amount_cad: number;
  interac_phone_or_email: string;
  confirmation_email_phone_correct: boolean;
  account_type: string;
  institution_no: string;
  transit_no: string;
  account_no: string;
  cheque_delivery_method: string;
  street_number_and_name: string;
  city: string;
  province_state: string;
  country: string;
  postal_code: string;
};

const ReimbursementForm: React.FC = () => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>();
  const [formStep, setFormStep] = useState(0);

  const onSubmit = async (data: FormData) => {
    const supabase = await createClient();
    try {
      // Get the logged-in user's ID
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
  
      if (userError || !user) {
        alert('Failed to get the logged-in user.');
        throw userError;
      }
      // Generate a unique UUID for the new record
      const request_id = uuidv4();
      const user_id = user.id;
      const newData = { request_id:  request_id, user_id: user_id, ...data };
  
      // Insert the payment request
      const { error } = await supabase
        .from('payment_requests')
        .insert([newData]);
  
      if (error) {
        if (error.code === '23505') { // Unique violation error code for PostgreSQL
          alert('A record with this information already exists.');
        } else {
          alert(`Failed to submit the form: ${error.message}`);
        }
        throw error;
      }
      alert('Form submitted successfully');
  
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto bg-white p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">MES Payment and Reimbursement Form</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          {formStep === 0 && (
            <>
              <div className="mb-4">
                <label htmlFor="email_address" className="block text-sm font-medium">Email Address</label>
                <input
                  {...register('email_address', { required: 'Email is required' })}
                  type="email"
                  className="mt-1 p-2 border rounded w-full"
                />
                {errors.email_address && <p className="text-red-500 text-sm">{errors.email_address.message}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="full_name" className="block text-sm font-medium">Full Name</label>
                <input
                  {...register('full_name', { required: 'Full name is required' })}
                  type="text"
                  className="mt-1 p-2 border rounded w-full"
                />
                {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name.message}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="contact_phone_number" className="block text-sm font-medium">Contact Phone Number</label>
                <input
                  {...register('contact_phone_number', { required: 'Phone number is required' })}
                  type="tel"
                  className="mt-1 p-2 border rounded w-full"
                />
                {errors.contact_phone_number && <p className="text-red-500 text-sm">{errors.contact_phone_number.message}</p>}
              </div>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(1)}
              >
                Next
              </button>
            </>
          )}

          {formStep === 1 && (
            <>
              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium">Role</label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select role</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Chief Returning Officer">Chief Returning Officer</option>
                  <option value="Community Integration">Community Integration</option>
                  <option value="Culture Coordinator(s)">Culture Coordinator(s)</option>
                  <option value="Director, Academic Resources">Director, Academic Resources</option>
                  <option value="Director, Clubs">Director, Clubs</option>
                  <option value="Director, Events">Director, Events</option>
                  <option value="Drain Coordinator(s)">Drain Coordinator(s)</option>
                  <option value="DW Lounge Coordinator(s)">DW Lounge Coordinator(s)</option>
                  <option value="Equity and Inclusion Officer">Equity and Inclusion Officer</option>
                  <option value="Fireball Coordinator(s)">Fireball Coordinator(s)</option>
                  <option value="Frequency Editor(s)">Frequency Editor(s)</option>
                  <option value="Gerald Hatch Centre Student Coordinator(s)">Gerald Hatch Centre Student Coordinator(s)</option>
                  <option value="Graphic Designer(s)">Graphic Designer(s)</option>
                  <option value="Information Technology Coordinator(s)">Information Technology Coordinator(s)</option>
                  <option value="Kennedy Coordinator(s)">Kennedy Coordinator(s)</option>
                  <option value="Leadership Development Committee Coordinator(s)">Leadership Development Committee Coordinator(s)</option>
                  <option value="macLAB Chair">macLAB Chair</option>
                  <option value="Manager, Advancement and Development">Manager, Advancement and Development</option>
                  <option value="Manager, Operations">Manager, Operations</option>
                  <option value="Mentorship Coordinator(s)">Mentorship Coordinator(s)</option>
                  <option value="Office Cleaner">Office Cleaner</option>
                  <option value="Photographer/Videographer(s)">Photographer/Videographer(s)</option>
                  <option value="Professional Development Coordinator(s)">Professional Development Coordinator(s)</option>
                  <option value="Publications Editor">Publications Editor</option>
                  <option value="Social Media Coordinator(s)">Social Media Coordinator(s)</option>
                  <option value="Sponsorship Coordinator(s)">Sponsorship Coordinator(s)</option>
                  <option value="Sports Coordinator(s)">Sports Coordinator(s)</option>
                  <option value="Student Projects Coordinator(s)">Student Projects Coordinator(s)</option>
                  <option value="Sustainability Coordinator(s)">Sustainability Coordinator(s)</option>
                  <option value="Trailer Coordinator(s)">Trailer Coordinator(s)</option>
                  <option value="Website Coordinator(s)">Website Coordinator(s)</option>
                  <option value="Wellness Coordinator(s)">Wellness Coordinator(s)</option>
                  <option value="Program Representative, Bachelor of Technology">Program Representative, Bachelor of Technology</option>
                  <option value="Program Representative, Chemical Engineering">Program Representative, Chemical Engineering</option>
                  <option value="Program Representative, Civil Engineering">Program Representative, Civil Engineering</option>
                  <option value="Program Representative, Computer Science">Program Representative, Computer Science</option>
                  <option value="Program Representative, Electrical and Computer Engineering">Program Representative, Electrical and Computer Engineering</option>
                  <option value="Program Representative, Engineering and Management">Program Representative, Engineering and Management</option>
                  <option value="Program Representative, Engineering and Society">Program Representative, Engineering and Society</option>
                  <option value="Program Representative, Engineering Physics">Program Representative, Engineering Physics</option>
                  <option value="Program Representative, Integrated Biomedical Engineering & Health Sciences">Program Representative, Integrated Biomedical Engineering & Health Sciences</option>
                  <option value="Program Representative, Materials Science and Engineering">Program Representative, Materials Science and Engineering</option>
                  <option value="Program Representative, Mechanical Engineering">Program Representative, Mechanical Engineering</option>
                  <option value="Program Representative, Mechatronics Engineering">Program Representative, Mechatronics Engineering</option>
                  <option value="Program Representative, Software Engineering">Program Representative, Software Engineering</option>
                  <option value="Vice President, Academic">Vice President, Academic</option>
                  <option value="Vice President, Communications">Vice President, Communications</option>
                  <option value="Vice President, External Relations">Vice President, External Relations</option>
                  <option value="Vice President, Finance">Vice President, Finance</option>
                  <option value="Vice President, Internal">Vice President, Internal</option>
                  <option value="Vice President, Student Life">Vice President, Student Life</option>
                  <option value="President">President</option>
                </select>
                {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
              </div>
              <div className="mb-4">
              <label htmlFor="budget_line" className="block text-sm font-medium">Relevant Budget Line</label>
                <select
                  {...register('budget_line', { required: 'Budget line is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select budget line</option>
                  <option value="Academic Events & Info Sessions">Academic Events & Info Sessions</option>
                  <option value="Academic Resources">Academic Resources</option>
                  <option value="Accounting Software">Accounting Software</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Audit">Audit</option>
                  <option value="Awards">Awards</option>
                  <option value="B2S Week">B2S Week</option>
                  <option value="Bank Fees">Bank Fees</option>
                  <option value="Bookkeeper">Bookkeeper</option>
                  <option value="Capstone Fund">Capstone Fund</option>
                  <option value="CFES Membership">CFES Membership</option>
                  <option value="CFES Presidents' Meeting">CFES Presidents' Meeting</option>
                  <option value="Closed Conferences & Competitions">Closed Conferences & Competitions</option>
                  <option value="Clubfest">Clubfest</option>
                  <option value="Community Outreach">Community Outreach</option>
                  <option value="Coordinator Retention">Coordinator Retention</option>
                  <option value="Council Operations">Council Operations</option>
                  <option value="Culture">Culture</option>
                  <option value="Director of Events">Director of Events</option>
                  <option value="ECCS Fees">ECCS Fees</option>
                  <option value="Elections">Elections</option>
                  <option value="Engineering Competition Delegate Funding">Engineering Competition Delegate Funding</option>
                  <option value="Engineering Help Centre">Engineering Help Centre</option>
                  <option value="ESSCO Membership">ESSCO Membership</option>
                  <option value="ESSCO Ontario Engineering Competition">ESSCO Ontario Engineering Competition</option>
                  <option value="Executive Operations">Executive Operations</option>
                  <option value="Executive Planning Weekend">Executive Planning Weekend</option>
                  <option value="Faculty Frenzy">Faculty Frenzy</option>
                  <option value="Fireball">Fireball</option>
                  <option value="First Year Society">First Year Society</option>
                  <option value="Frequency">Frequency</option>
                  <option value="Frost Week">Frost Week</option>
                  <option value="Fundraising Donations">Fundraising Donations</option>
                  <option value="Handbook">Handbook</option>
                  <option value="Hatch Student Spaces">Hatch Student Spaces</option>
                  <option value="Hatch Student Workshop">Hatch Student Workshop</option>
                  <option value="Intramurals">Intramurals</option>
                  <option value="IT">IT</option>
                  <option value="Jumpsuit Initiative">Jumpsuit Initiative</option>
                  <option value="Kennedy (formerly called Iron Ring)">Kennedy (formerly called Iron Ring)</option>
                  <option value="Leadership Development Conference">Leadership Development Conference</option>
                  <option value="Long Term Investments">Long Term Investments</option>
                  <option value="Lounge">Lounge</option>
                  <option value="McMaster Engineering Competition">McMaster Engineering Competition</option>
                  <option value="Mentorship Program">Mentorship Program</option>
                  <option value="MES Branding">MES Branding</option>
                  <option value="MES Card Supplies">MES Card Supplies</option>
                  <option value="National Engineering Month">National Engineering Month</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Oksoberfest">Oksoberfest</option>
                  <option value="Open Conferences & Competitions">Open Conferences & Competitions</option>
                  <option value="Operational Contingency">Operational Contingency</option>
                  <option value="Operations">Operations</option>
                  <option value="Professional Development">Professional Development</option>
                  <option value="Semi Annual General Meeting">Semi Annual General Meeting</option>
                  <option value="Sports Events">Sports Events</option>
                  <option value="Spread the Love Week">Spread the Love Week</option>
                  <option value="Student Group Leadership Training">Student Group Leadership Training</option>
                  <option value="Student Projects">Student Projects</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Talent Show">Talent Show</option>
                  <option value="The Drain">The Drain</option>
                  <option value="The Event">The Event</option>
                  <option value="Town Halls">Town Halls</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Trivia Night">Trivia Night</option>
                  <option value="Tutoring Program">Tutoring Program</option>
                  <option value="Two Way Radio Frequency License">Two Way Radio Frequency License</option>
                  <option value="Website / InfraTech">Website / InfraTech</option>
                  <option value="Welcome Week">Welcome Week</option>
                  <option value="Wellness">Wellness</option>
                </select>
                {errors.budget_line && <p className="text-red-500 text-sm">{errors.budget_line.message}</p>}
              </div>
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(0)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(2)}
              >
                Next
              </button>
            </>
          )}

          {formStep === 2 && (
            <>
              <div className="mb-4">
                <label htmlFor="budget_line" className="block text-sm font-medium">Relevant Budget Line</label>
                <select
                  {...register('budget_line', { required: 'Budget line is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select budget line</option>
                  <option value="Academic Events & Info Sessions">Academic Events & Info Sessions</option>
                  <option value="Academic Resources">Academic Resources</option>
                  <option value="Accounting Software">Accounting Software</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Audit">Audit</option>
                  <option value="Awards">Awards</option>
                  <option value="B2S Week">B2S Week</option>
                  <option value="Bank Fees">Bank Fees</option>
                  <option value="Bookkeeper">Bookkeeper</option>
                  <option value="Capstone Fund">Capstone Fund</option>
                  <option value="CFES Membership">CFES Membership</option>
                  <option value="CFES Presidents' Meeting">CFES Presidents' Meeting</option>
                  <option value="Closed Conferences & Competitions">Closed Conferences & Competitions</option>
                  <option value="Clubfest">Clubfest</option>
                  <option value="Community Outreach">Community Outreach</option>
                  <option value="Coordinator Retention">Coordinator Retention</option>
                  <option value="Council Operations">Council Operations</option>
                  <option value="Culture">Culture</option>
                  <option value="Director of Events">Director of Events</option>
                  <option value="ECCS Fees">ECCS Fees</option>
                  <option value="Elections">Elections</option>
                  <option value="Engineering Competition Delegate Funding">Engineering Competition Delegate Funding</option>
                  <option value="Engineering Help Centre">Engineering Help Centre</option>
                  <option value="ESSCO Membership">ESSCO Membership</option>
                  <option value="ESSCO Ontario Engineering Competition">ESSCO Ontario Engineering Competition</option>
                  <option value="Executive Operations">Executive Operations</option>
                  <option value="Executive Planning Weekend">Executive Planning Weekend</option>
                  <option value="Faculty Frenzy">Faculty Frenzy</option>
                  <option value="Fireball">Fireball</option>
                  <option value="First Year Society">First Year Society</option>
                  <option value="Frequency">Frequency</option>
                  <option value="Frost Week">Frost Week</option>
                  <option value="Fundraising Donations">Fundraising Donations</option>
                  <option value="Handbook">Handbook</option>
                  <option value="Hatch Student Spaces">Hatch Student Spaces</option>
                  <option value="Hatch Student Workshop">Hatch Student Workshop</option>
                  <option value="Intramurals">Intramurals</option>
                  <option value="IT">IT</option>
                  <option value="Jumpsuit Initiative">Jumpsuit Initiative</option>
                  <option value="Kennedy (formerly called Iron Ring)">Kennedy (formerly called Iron Ring)</option>
                  <option value="Leadership Development Conference">Leadership Development Conference</option>
                  <option value="Long Term Investments">Long Term Investments</option>
                  <option value="Lounge">Lounge</option>
                  <option value="McMaster Engineering Competition">McMaster Engineering Competition</option>
                  <option value="Mentorship Program">Mentorship Program</option>
                  <option value="MES Branding">MES Branding</option>
                  <option value="MES Card Supplies">MES Card Supplies</option>
                  <option value="National Engineering Month">National Engineering Month</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Oksoberfest">Oksoberfest</option>
                  <option value="Open Conferences & Competitions">Open Conferences & Competitions</option>
                  <option value="Operational Contingency">Operational Contingency</option>
                  <option value="Operations">Operations</option>
                  <option value="Professional Development">Professional Development</option>
                  <option value="Semi Annual General Meeting">Semi Annual General Meeting</option>
                  <option value="Sports Events">Sports Events</option>
                  <option value="Spread the Love Week">Spread the Love Week</option>
                  <option value="Student Group Leadership Training">Student Group Leadership Training</option>
                  <option value="Student Projects">Student Projects</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Talent Show">Talent Show</option>
                  <option value="The Drain">The Drain</option>
                  <option value="The Event">The Event</option>
                  <option value="Town Halls">Town Halls</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Trivia Night">Trivia Night</option>
                  <option value="Tutoring Program">Tutoring Program</option>
                  <option value="Two Way Radio Frequency License">Two Way Radio Frequency License</option>
                  <option value="Website / InfraTech">Website / InfraTech</option>
                  <option value="Welcome Week">Welcome Week</option>
                  <option value="Wellness">Wellness</option>
                </select>
                {errors.budget_line && <p className="text-red-500 text-sm">{errors.budget_line.message}</p>}
              </div>
              {/* Additional sections... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(3)}
              >
                Next
              </button>
              
            </>
          )}

          {formStep === 3 && (
            <>
              <div className="mb-4">
                <label htmlFor="group_or_team_name" className="block text-sm font-medium">Club, Team, or Program Society Information</label>
                <select
                  {...register('group_or_team_name', { required: 'Group/Team Required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Please select the name of your group or team.</option>
                  <option value="Aerospace">Aerospace</option>
                  <option value="Bachelor of Technology Association">Bachelor of Technology Association</option>
                  <option value="Baja Racing">Baja Racing</option>
                  <option value="Chem E Car">Chem E Car</option>
                  <option value="Chem Eng Society">Chem Eng Society</option>
                  <option value="Civil Engineering Society">Civil Engineering Society</option>
                  <option value="Competitive Programming">Competitive Programming</option>
                  <option value="Computer Science Society">Computer Science Society</option>
                  <option value="Deep Space Analogue Research Expedition">Deep Space Analogue Research Expedition</option>
                  <option value="DeltaHacks">DeltaHacks</option>
                  <option value="Design League">Design League</option>
                  <option value="EcoCar">EcoCar</option>
                  <option value="Electrical and Computer Engineering Society">Electrical and Computer Engineering Society</option>
                  <option value="Engineering and Society Students’ Association">Engineering and Society Students’ Association</option>
                  <option value="Engineering Musical">Engineering Musical</option>
                  <option value="Engineering Physics Society">Engineering Physics Society</option>
                  <option value="Engineers Without Borders">Engineers Without Borders</option>
                  <option value="EngiQueers">EngiQueers</option>
                  <option value="Google Developer Student Clubs">Google Developer Student Clubs</option>
                  <option value="HealthHatch">HealthHatch</option>
                  <option value="Heavy Construction Student Chapter">Heavy Construction Student Chapter</option>
                  <option value="iBioMed Society">iBioMed Society</option>
                  <option value="Institute of Electrical and Electronics Engineers Student Branch">Institute of Electrical and Electronics Engineers Student Branch</option>
                  <option value="Institute of Transportation Engineers Student Chapter">Institute of Transportation Engineers Student Chapter</option>
                  <option value="MAC Formula Electric">MAC Formula Electric</option>
                  <option value="Mars Rover">Mars Rover</option>
                  <option value="Materials Science and Engineering Society">Materials Science and Engineering Society</option>
                  <option value="McMaster Energy Association">McMaster Energy Association</option>
                  <option value="McMaster Engineering and Management Society">McMaster Engineering and Management Society</option>
                  <option value="McMaster Engineering Concrete Toboggan Team">McMaster Engineering Concrete Toboggan Team</option>
                  <option value="McMaster Engineering Hockey Club">McMaster Engineering Hockey Club</option>
                  <option value="McMaster Engineers with Disabilities">McMaster Engineers with Disabilities</option>
                  <option value="McMaster Mechatronics Society">McMaster Mechatronics Society</option>
                  <option value="McMaster Pumpkin Chunkin">McMaster Pumpkin Chunkin</option>
                  <option value="McMaster Society for Engineering Research">McMaster Society for Engineering Research</option>
                  <option value="McMaster Society of Mechanical Engineering">McMaster Society of Mechanical Engineering</option>
                  <option value="Mechanical Contractors Association Hamilton Niagara Student Chapter">Mechanical Contractors Association Hamilton Niagara Student Chapter</option>
                  <option value="Medical Engineering Design Team">Medical Engineering Design Team</option>
                  <option value="National Society of Black Engineers">National Society of Black Engineers</option>
                  <option value="North American Young Generation in Nuclear">North American Young Generation in Nuclear</option>
                  <option value="RoboMaster">RoboMaster</option>
                  <option value="Rocketry">Rocketry</option>
                  <option value="Seismic Design">Seismic Design</option>
                  <option value="Software Engineering Society">Software Engineering Society</option>
                  <option value="Solar Car">Solar Car</option>
                  <option value="Start Coding">Start Coding</option>
                  <option value="Steel Bridge">Steel Bridge</option>
                  <option value="Sumobot">Sumobot</option>
                  <option value="Women in Engineering">Women in Engineering</option>
                </select>
                {errors.budget_line && <p className="text-red-500 text-sm">{errors.budget_line.message}</p>}
              </div>
              {/* Additional sections... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(2)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(4)}
              >
                Next
              </button>
              
            </>
          )}

          {formStep === 4 && (
            <>
            <div className="mb-4">
                <label htmlFor="approved_individual_or_project_name" className="block text-sm font-medium">Please enter the name of the individual, project or the student group that's been approved by the Student Projects Coordinator(s).</label>
                <input
                  {...register('approved_individual_or_project_name', { required: 'Email is required' })}
                  type="email"
                  className="mt-1 p-2 border rounded w-full"
                />
                {errors.approved_individual_or_project_name && <p className="text-red-500 text-sm">{errors.approved_individual_or_project_name.message}</p>}
              </div>
              
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(3)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(5)}
              >
                Next
              </button>
              
            </>
          )}

          {formStep === 5 && (
            <>
              <div className="mb-4">
                <label htmlFor="sport_and_team_name" className="block text-sm font-medium">Please select the sport and team name that was submitted to the  Intramural Reimbursement Request 2024/25 form.</label>
                <select
                  {...register('sport_and_team_name', { required: 'Sport and Team Name is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select Sport and Team Name</option>
                  <option value="Badminton - Dinogals">Badminton - Dinogals</option>
                  <option value="Badminton - Down Bad-Minton">Badminton - Down Bad-Minton</option>
                  <option value="Badminton - Feather Fighters">Badminton - Feather Fighters</option>
                  <option value="Basketball - Hungry Marauders">Basketball - Hungry Marauders</option>
                  <option value="Basketball - idk?">Basketball - idk?</option>
                  <option value="Basketball - Places">Basketball - Places</option>
                  <option value="Ice Hockey - Iron Ringers">Ice Hockey - Iron Ringers</option>
                  <option value="Ice Hockey - The Steel Beams">Ice Hockey - The Steel Beams</option>
                  <option value="Indoor Ultimate Frisbee - Grenglins">Indoor Ultimate Frisbee - Grenglins</option>
                  <option value="Indoor Ultimate Frisbee - KerrrrrFrisbee">Indoor Ultimate Frisbee - KerrrrrFrisbee</option>
                  <option value="Innertube H20-Basketball - Soaked and Slammin">Innertube H20-Basketball - Soaked and Slammin</option>
                  <option value="Innertube H20-Polo - BÜNT BUS">Innertube H20-Polo - BÜNT BUS</option>
                  <option value="Innertube H20-Polo - The Fried Pollos">Innertube H20-Polo - The Fried Pollos</option>
                  <option value="Soccer - Ansh Kuckreja">Soccer - Ansh Kuckreja</option>
                  <option value="Soccer - Balls">Soccer - Balls</option>
                  <option value="Soccer - FOOTY 1A03">Soccer - FOOTY 1A03</option>
                  <option value="Soccer - Hedden Headers">Soccer - Hedden Headers</option>
                  <option value="Soccer - It's Called Football">Soccer - It's Called Football</option>
                  <option value="Soccer - Jess and friends">Soccer - Jess and friends</option>
                  <option value="Soccer - LeEngineers">Soccer - LeEngineers</option>
                  <option value="Soccer - Material Girls">Soccer - Material Girls</option>
                  <option value="Soccer - Soccer">Soccer - Soccer</option>
                  <option value="Soccer - Togo Salmon Hall B128">Soccer - Togo Salmon Hall B128</option>
                  <option value="Spike Ball - Barely Passing">Spike Ball - Barely Passing</option>
                  <option value="Spike Ball - Diddy Kong">Spike Ball - Diddy Kong</option>
                  <option value="Spike Ball - RatPack">Spike Ball - RatPack</option>
                  <option value="Volleyball - Arabica">Volleyball - Arabica</option>
                  <option value="Volleyball - MDL">Volleyball - MDL</option>
                  <option value="Volleyball - Net Force">Volleyball - Net Force</option>
                  <option value="Volleyball - Pull me for a good time">Volleyball - Pull me for a good time</option>
                  <option value="Volleyball - Rip Himanshu">Volleyball - Rip Himanshu</option>
                  <option value="Volleyball - Spike City">Volleyball - Spike City</option>
                  <option value="Volleyball - Super Smash Bros">Volleyball - Super Smash Bros</option>
                  <option value="Volleyball - team1">Volleyball - team1</option>
                  <option value="Volleyball - The Volleyball Game!">Volleyball - The Volleyball Game!</option>
                  <option value="Volleyball - Volleyballers">Volleyball - Volleyballers</option>
                  
                </select>
                {errors.budget_line && <p className="text-red-500 text-sm">{errors.budget_line.message}</p>}
              </div>
              {/* Additional sections... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(4)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(6)}
              >
                Next
              </button>
              
            </>
          )}

          {formStep === 6 && (
            <>
              <div className="mb-4">
                <label htmlFor="conference_or_competition_name" className="block text-sm font-medium">Please enter the name of the conference or competition.</label>
                <input
                  {...register('conference_or_competition_name', { required: 'Name is required' })}
                  type="email"
                  className="mt-1 p-2 border rounded w-full"
                />
                {errors.conference_or_competition_name && <p className="text-red-500 text-sm">{errors.conference_or_competition_name.message}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="conference_competition_type" className="block text-sm font-medium">What type of conference/competition did you attend?</label>
                <select
                  {...register('conference_competition_type', { required: 'Selection Required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select Option</option>
                  <option value="Open Conference/Competition">Open Conference/Competition</option>
                  <option value="Affiliate Conference/Competition">Affiliate Conference/Competition</option>
                  
                </select>
                {errors.conference_competition_type && <p className="text-red-500 text-sm">{errors.conference_competition_type.message}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="head_delegate" className="block text-sm font-medium">Are you the Head Delegate?</label>
                <select
                  {...register('head_delegate', { required: 'Selection Required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  
                </select>
                {errors.head_delegate && <p className="text-red-500 text-sm">{errors.head_delegate.message}</p>}
              </div>

              {/* add upload... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(5)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(7)}
              >
                Next
              </button>
              
            </>
          )}

          {formStep === 7 && (
            <>
              <div className="mb-4">
                <label htmlFor="reimbursement_or_payment" className="block text-sm font-medium">Reimbursement or Payment?</label>
                <select
                  {...register('reimbursement_or_payment', { required: 'Selection Required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select Option</option>
                  <option value="Reimbursement Request">Reimbursement Request</option>
                  <option value="Payment Request">Payment Request</option>
                  
                </select>
                {errors.reimbursement_or_payment && <p className="text-red-500 text-sm">{errors.reimbursement_or_payment.message}</p>}
              </div>
              {/* Additional sections... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(6)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(8)}
              >
                Next
              </button>
              
            </>
          )}

          {formStep === 8 && (
            <>
              <div className="mb-4">
                <label htmlFor="budget_line" className="block text-sm font-medium">Relevant Budget Line</label>
                <select
                  {...register('budget_line', { required: 'Budget line is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select budget line</option>
                  <option value="Academic Events & Info Sessions">Academic Events & Info Sessions</option>
                  <option value="Academic Resources">Academic Resources</option>
                  <option value="Accounting Software">Accounting Software</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Audit">Audit</option>
                  <option value="Awards">Awards</option>
                  <option value="B2S Week">B2S Week</option>
                  <option value="Bank Fees">Bank Fees</option>
                  <option value="Bookkeeper">Bookkeeper</option>
                  <option value="Capstone Fund">Capstone Fund</option>
                  <option value="CFES Membership">CFES Membership</option>
                  <option value="CFES Presidents' Meeting">CFES Presidents' Meeting</option>
                  <option value="Closed Conferences & Competitions">Closed Conferences & Competitions</option>
                  <option value="Clubfest">Clubfest</option>
                  <option value="Community Outreach">Community Outreach</option>
                  <option value="Coordinator Retention">Coordinator Retention</option>
                  <option value="Council Operations">Council Operations</option>
                  <option value="Culture">Culture</option>
                  <option value="Director of Events">Director of Events</option>
                  <option value="ECCS Fees">ECCS Fees</option>
                  <option value="Elections">Elections</option>
                  <option value="Engineering Competition Delegate Funding">Engineering Competition Delegate Funding</option>
                  <option value="Engineering Help Centre">Engineering Help Centre</option>
                  <option value="ESSCO Membership">ESSCO Membership</option>
                  <option value="ESSCO Ontario Engineering Competition">ESSCO Ontario Engineering Competition</option>
                  <option value="Executive Operations">Executive Operations</option>
                  <option value="Executive Planning Weekend">Executive Planning Weekend</option>
                  <option value="Faculty Frenzy">Faculty Frenzy</option>
                  <option value="Fireball">Fireball</option>
                  <option value="First Year Society">First Year Society</option>
                  <option value="Frequency">Frequency</option>
                  <option value="Frost Week">Frost Week</option>
                  <option value="Fundraising Donations">Fundraising Donations</option>
                  <option value="Handbook">Handbook</option>
                  <option value="Hatch Student Spaces">Hatch Student Spaces</option>
                  <option value="Hatch Student Workshop">Hatch Student Workshop</option>
                  <option value="Intramurals">Intramurals</option>
                  <option value="IT">IT</option>
                  <option value="Jumpsuit Initiative">Jumpsuit Initiative</option>
                  <option value="Kennedy (formerly called Iron Ring)">Kennedy (formerly called Iron Ring)</option>
                  <option value="Leadership Development Conference">Leadership Development Conference</option>
                  <option value="Long Term Investments">Long Term Investments</option>
                  <option value="Lounge">Lounge</option>
                  <option value="McMaster Engineering Competition">McMaster Engineering Competition</option>
                  <option value="Mentorship Program">Mentorship Program</option>
                  <option value="MES Branding">MES Branding</option>
                  <option value="MES Card Supplies">MES Card Supplies</option>
                  <option value="National Engineering Month">National Engineering Month</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Oksoberfest">Oksoberfest</option>
                  <option value="Open Conferences & Competitions">Open Conferences & Competitions</option>
                  <option value="Operational Contingency">Operational Contingency</option>
                  <option value="Operations">Operations</option>
                  <option value="Professional Development">Professional Development</option>
                  <option value="Semi Annual General Meeting">Semi Annual General Meeting</option>
                  <option value="Sports Events">Sports Events</option>
                  <option value="Spread the Love Week">Spread the Love Week</option>
                  <option value="Student Group Leadership Training">Student Group Leadership Training</option>
                  <option value="Student Projects">Student Projects</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Talent Show">Talent Show</option>
                  <option value="The Drain">The Drain</option>
                  <option value="The Event">The Event</option>
                  <option value="Town Halls">Town Halls</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Trivia Night">Trivia Night</option>
                  <option value="Tutoring Program">Tutoring Program</option>
                  <option value="Two Way Radio Frequency License">Two Way Radio Frequency License</option>
                  <option value="Website / InfraTech">Website / InfraTech</option>
                  <option value="Welcome Week">Welcome Week</option>
                  <option value="Wellness">Wellness</option>
                </select>
                {errors.budget_line && <p className="text-red-500 text-sm">{errors.budget_line.message}</p>}
              </div>
              {/* Additional sections... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(3)}
              >
                Next
              </button>
              
            </>
          )}

        {formStep === 9 && (
            <>
              <div className="mb-4">
                <label htmlFor="budget_line" className="block text-sm font-medium">Relevant Budget Line</label>
                <select
                  {...register('budget_line', { required: 'Budget line is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select budget line</option>
                  <option value="Academic Events & Info Sessions">Academic Events & Info Sessions</option>
                  <option value="Academic Resources">Academic Resources</option>
                  <option value="Accounting Software">Accounting Software</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Audit">Audit</option>
                  <option value="Awards">Awards</option>
                  <option value="B2S Week">B2S Week</option>
                  <option value="Bank Fees">Bank Fees</option>
                  <option value="Bookkeeper">Bookkeeper</option>
                  <option value="Capstone Fund">Capstone Fund</option>
                  <option value="CFES Membership">CFES Membership</option>
                  <option value="CFES Presidents' Meeting">CFES Presidents' Meeting</option>
                  <option value="Closed Conferences & Competitions">Closed Conferences & Competitions</option>
                  <option value="Clubfest">Clubfest</option>
                  <option value="Community Outreach">Community Outreach</option>
                  <option value="Coordinator Retention">Coordinator Retention</option>
                  <option value="Council Operations">Council Operations</option>
                  <option value="Culture">Culture</option>
                  <option value="Director of Events">Director of Events</option>
                  <option value="ECCS Fees">ECCS Fees</option>
                  <option value="Elections">Elections</option>
                  <option value="Engineering Competition Delegate Funding">Engineering Competition Delegate Funding</option>
                  <option value="Engineering Help Centre">Engineering Help Centre</option>
                  <option value="ESSCO Membership">ESSCO Membership</option>
                  <option value="ESSCO Ontario Engineering Competition">ESSCO Ontario Engineering Competition</option>
                  <option value="Executive Operations">Executive Operations</option>
                  <option value="Executive Planning Weekend">Executive Planning Weekend</option>
                  <option value="Faculty Frenzy">Faculty Frenzy</option>
                  <option value="Fireball">Fireball</option>
                  <option value="First Year Society">First Year Society</option>
                  <option value="Frequency">Frequency</option>
                  <option value="Frost Week">Frost Week</option>
                  <option value="Fundraising Donations">Fundraising Donations</option>
                  <option value="Handbook">Handbook</option>
                  <option value="Hatch Student Spaces">Hatch Student Spaces</option>
                  <option value="Hatch Student Workshop">Hatch Student Workshop</option>
                  <option value="Intramurals">Intramurals</option>
                  <option value="IT">IT</option>
                  <option value="Jumpsuit Initiative">Jumpsuit Initiative</option>
                  <option value="Kennedy (formerly called Iron Ring)">Kennedy (formerly called Iron Ring)</option>
                  <option value="Leadership Development Conference">Leadership Development Conference</option>
                  <option value="Long Term Investments">Long Term Investments</option>
                  <option value="Lounge">Lounge</option>
                  <option value="McMaster Engineering Competition">McMaster Engineering Competition</option>
                  <option value="Mentorship Program">Mentorship Program</option>
                  <option value="MES Branding">MES Branding</option>
                  <option value="MES Card Supplies">MES Card Supplies</option>
                  <option value="National Engineering Month">National Engineering Month</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Oksoberfest">Oksoberfest</option>
                  <option value="Open Conferences & Competitions">Open Conferences & Competitions</option>
                  <option value="Operational Contingency">Operational Contingency</option>
                  <option value="Operations">Operations</option>
                  <option value="Professional Development">Professional Development</option>
                  <option value="Semi Annual General Meeting">Semi Annual General Meeting</option>
                  <option value="Sports Events">Sports Events</option>
                  <option value="Spread the Love Week">Spread the Love Week</option>
                  <option value="Student Group Leadership Training">Student Group Leadership Training</option>
                  <option value="Student Projects">Student Projects</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Talent Show">Talent Show</option>
                  <option value="The Drain">The Drain</option>
                  <option value="The Event">The Event</option>
                  <option value="Town Halls">Town Halls</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Trivia Night">Trivia Night</option>
                  <option value="Tutoring Program">Tutoring Program</option>
                  <option value="Two Way Radio Frequency License">Two Way Radio Frequency License</option>
                  <option value="Website / InfraTech">Website / InfraTech</option>
                  <option value="Welcome Week">Welcome Week</option>
                  <option value="Wellness">Wellness</option>
                </select>
                {errors.budget_line && <p className="text-red-500 text-sm">{errors.budget_line.message}</p>}
              </div>
              {/* Additional sections... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(3)}
              >
                Next
              </button>
              
            </>
          )}

        {formStep === 10 && (
            <>
              <div className="mb-4">
                <label htmlFor="budget_line" className="block text-sm font-medium">Relevant Budget Line</label>
                <select
                  {...register('budget_line', { required: 'Budget line is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select budget line</option>
                  <option value="Academic Events & Info Sessions">Academic Events & Info Sessions</option>
                  <option value="Academic Resources">Academic Resources</option>
                  <option value="Accounting Software">Accounting Software</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Audit">Audit</option>
                  <option value="Awards">Awards</option>
                  <option value="B2S Week">B2S Week</option>
                  <option value="Bank Fees">Bank Fees</option>
                  <option value="Bookkeeper">Bookkeeper</option>
                  <option value="Capstone Fund">Capstone Fund</option>
                  <option value="CFES Membership">CFES Membership</option>
                  <option value="CFES Presidents' Meeting">CFES Presidents' Meeting</option>
                  <option value="Closed Conferences & Competitions">Closed Conferences & Competitions</option>
                  <option value="Clubfest">Clubfest</option>
                  <option value="Community Outreach">Community Outreach</option>
                  <option value="Coordinator Retention">Coordinator Retention</option>
                  <option value="Council Operations">Council Operations</option>
                  <option value="Culture">Culture</option>
                  <option value="Director of Events">Director of Events</option>
                  <option value="ECCS Fees">ECCS Fees</option>
                  <option value="Elections">Elections</option>
                  <option value="Engineering Competition Delegate Funding">Engineering Competition Delegate Funding</option>
                  <option value="Engineering Help Centre">Engineering Help Centre</option>
                  <option value="ESSCO Membership">ESSCO Membership</option>
                  <option value="ESSCO Ontario Engineering Competition">ESSCO Ontario Engineering Competition</option>
                  <option value="Executive Operations">Executive Operations</option>
                  <option value="Executive Planning Weekend">Executive Planning Weekend</option>
                  <option value="Faculty Frenzy">Faculty Frenzy</option>
                  <option value="Fireball">Fireball</option>
                  <option value="First Year Society">First Year Society</option>
                  <option value="Frequency">Frequency</option>
                  <option value="Frost Week">Frost Week</option>
                  <option value="Fundraising Donations">Fundraising Donations</option>
                  <option value="Handbook">Handbook</option>
                  <option value="Hatch Student Spaces">Hatch Student Spaces</option>
                  <option value="Hatch Student Workshop">Hatch Student Workshop</option>
                  <option value="Intramurals">Intramurals</option>
                  <option value="IT">IT</option>
                  <option value="Jumpsuit Initiative">Jumpsuit Initiative</option>
                  <option value="Kennedy (formerly called Iron Ring)">Kennedy (formerly called Iron Ring)</option>
                  <option value="Leadership Development Conference">Leadership Development Conference</option>
                  <option value="Long Term Investments">Long Term Investments</option>
                  <option value="Lounge">Lounge</option>
                  <option value="McMaster Engineering Competition">McMaster Engineering Competition</option>
                  <option value="Mentorship Program">Mentorship Program</option>
                  <option value="MES Branding">MES Branding</option>
                  <option value="MES Card Supplies">MES Card Supplies</option>
                  <option value="National Engineering Month">National Engineering Month</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Oksoberfest">Oksoberfest</option>
                  <option value="Open Conferences & Competitions">Open Conferences & Competitions</option>
                  <option value="Operational Contingency">Operational Contingency</option>
                  <option value="Operations">Operations</option>
                  <option value="Professional Development">Professional Development</option>
                  <option value="Semi Annual General Meeting">Semi Annual General Meeting</option>
                  <option value="Sports Events">Sports Events</option>
                  <option value="Spread the Love Week">Spread the Love Week</option>
                  <option value="Student Group Leadership Training">Student Group Leadership Training</option>
                  <option value="Student Projects">Student Projects</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Talent Show">Talent Show</option>
                  <option value="The Drain">The Drain</option>
                  <option value="The Event">The Event</option>
                  <option value="Town Halls">Town Halls</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Trivia Night">Trivia Night</option>
                  <option value="Tutoring Program">Tutoring Program</option>
                  <option value="Two Way Radio Frequency License">Two Way Radio Frequency License</option>
                  <option value="Website / InfraTech">Website / InfraTech</option>
                  <option value="Welcome Week">Welcome Week</option>
                  <option value="Wellness">Wellness</option>
                </select>
                {errors.budget_line && <p className="text-red-500 text-sm">{errors.budget_line.message}</p>}
              </div>
              {/* Additional sections... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(3)}
              >
                Next
              </button>
              
            </>
          )}

          {formStep === 11 && (
            <>
              <div className="mb-4">
                <label htmlFor="budget_line" className="block text-sm font-medium">Relevant Budget Line</label>
                <select
                  {...register('budget_line', { required: 'Budget line is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select budget line</option>
                  <option value="Academic Events & Info Sessions">Academic Events & Info Sessions</option>
                  <option value="Academic Resources">Academic Resources</option>
                  <option value="Accounting Software">Accounting Software</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Audit">Audit</option>
                  <option value="Awards">Awards</option>
                  <option value="B2S Week">B2S Week</option>
                  <option value="Bank Fees">Bank Fees</option>
                  <option value="Bookkeeper">Bookkeeper</option>
                  <option value="Capstone Fund">Capstone Fund</option>
                  <option value="CFES Membership">CFES Membership</option>
                  <option value="CFES Presidents' Meeting">CFES Presidents' Meeting</option>
                  <option value="Closed Conferences & Competitions">Closed Conferences & Competitions</option>
                  <option value="Clubfest">Clubfest</option>
                  <option value="Community Outreach">Community Outreach</option>
                  <option value="Coordinator Retention">Coordinator Retention</option>
                  <option value="Council Operations">Council Operations</option>
                  <option value="Culture">Culture</option>
                  <option value="Director of Events">Director of Events</option>
                  <option value="ECCS Fees">ECCS Fees</option>
                  <option value="Elections">Elections</option>
                  <option value="Engineering Competition Delegate Funding">Engineering Competition Delegate Funding</option>
                  <option value="Engineering Help Centre">Engineering Help Centre</option>
                  <option value="ESSCO Membership">ESSCO Membership</option>
                  <option value="ESSCO Ontario Engineering Competition">ESSCO Ontario Engineering Competition</option>
                  <option value="Executive Operations">Executive Operations</option>
                  <option value="Executive Planning Weekend">Executive Planning Weekend</option>
                  <option value="Faculty Frenzy">Faculty Frenzy</option>
                  <option value="Fireball">Fireball</option>
                  <option value="First Year Society">First Year Society</option>
                  <option value="Frequency">Frequency</option>
                  <option value="Frost Week">Frost Week</option>
                  <option value="Fundraising Donations">Fundraising Donations</option>
                  <option value="Handbook">Handbook</option>
                  <option value="Hatch Student Spaces">Hatch Student Spaces</option>
                  <option value="Hatch Student Workshop">Hatch Student Workshop</option>
                  <option value="Intramurals">Intramurals</option>
                  <option value="IT">IT</option>
                  <option value="Jumpsuit Initiative">Jumpsuit Initiative</option>
                  <option value="Kennedy (formerly called Iron Ring)">Kennedy (formerly called Iron Ring)</option>
                  <option value="Leadership Development Conference">Leadership Development Conference</option>
                  <option value="Long Term Investments">Long Term Investments</option>
                  <option value="Lounge">Lounge</option>
                  <option value="McMaster Engineering Competition">McMaster Engineering Competition</option>
                  <option value="Mentorship Program">Mentorship Program</option>
                  <option value="MES Branding">MES Branding</option>
                  <option value="MES Card Supplies">MES Card Supplies</option>
                  <option value="National Engineering Month">National Engineering Month</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Oksoberfest">Oksoberfest</option>
                  <option value="Open Conferences & Competitions">Open Conferences & Competitions</option>
                  <option value="Operational Contingency">Operational Contingency</option>
                  <option value="Operations">Operations</option>
                  <option value="Professional Development">Professional Development</option>
                  <option value="Semi Annual General Meeting">Semi Annual General Meeting</option>
                  <option value="Sports Events">Sports Events</option>
                  <option value="Spread the Love Week">Spread the Love Week</option>
                  <option value="Student Group Leadership Training">Student Group Leadership Training</option>
                  <option value="Student Projects">Student Projects</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Talent Show">Talent Show</option>
                  <option value="The Drain">The Drain</option>
                  <option value="The Event">The Event</option>
                  <option value="Town Halls">Town Halls</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Trivia Night">Trivia Night</option>
                  <option value="Tutoring Program">Tutoring Program</option>
                  <option value="Two Way Radio Frequency License">Two Way Radio Frequency License</option>
                  <option value="Website / InfraTech">Website / InfraTech</option>
                  <option value="Welcome Week">Welcome Week</option>
                  <option value="Wellness">Wellness</option>
                </select>
                {errors.budget_line && <p className="text-red-500 text-sm">{errors.budget_line.message}</p>}
              </div>
              {/* Additional sections... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(3)}
              >
                Next
              </button>
              
            </>
          )}

          {formStep === 12 && (
            <>
              <div className="mb-4">
                <label htmlFor="budget_line" className="block text-sm font-medium">Relevant Budget Line</label>
                <select
                  {...register('budget_line', { required: 'Budget line is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select budget line</option>
                  <option value="Academic Events & Info Sessions">Academic Events & Info Sessions</option>
                  <option value="Academic Resources">Academic Resources</option>
                  <option value="Accounting Software">Accounting Software</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Audit">Audit</option>
                  <option value="Awards">Awards</option>
                  <option value="B2S Week">B2S Week</option>
                  <option value="Bank Fees">Bank Fees</option>
                  <option value="Bookkeeper">Bookkeeper</option>
                  <option value="Capstone Fund">Capstone Fund</option>
                  <option value="CFES Membership">CFES Membership</option>
                  <option value="CFES Presidents' Meeting">CFES Presidents' Meeting</option>
                  <option value="Closed Conferences & Competitions">Closed Conferences & Competitions</option>
                  <option value="Clubfest">Clubfest</option>
                  <option value="Community Outreach">Community Outreach</option>
                  <option value="Coordinator Retention">Coordinator Retention</option>
                  <option value="Council Operations">Council Operations</option>
                  <option value="Culture">Culture</option>
                  <option value="Director of Events">Director of Events</option>
                  <option value="ECCS Fees">ECCS Fees</option>
                  <option value="Elections">Elections</option>
                  <option value="Engineering Competition Delegate Funding">Engineering Competition Delegate Funding</option>
                  <option value="Engineering Help Centre">Engineering Help Centre</option>
                  <option value="ESSCO Membership">ESSCO Membership</option>
                  <option value="ESSCO Ontario Engineering Competition">ESSCO Ontario Engineering Competition</option>
                  <option value="Executive Operations">Executive Operations</option>
                  <option value="Executive Planning Weekend">Executive Planning Weekend</option>
                  <option value="Faculty Frenzy">Faculty Frenzy</option>
                  <option value="Fireball">Fireball</option>
                  <option value="First Year Society">First Year Society</option>
                  <option value="Frequency">Frequency</option>
                  <option value="Frost Week">Frost Week</option>
                  <option value="Fundraising Donations">Fundraising Donations</option>
                  <option value="Handbook">Handbook</option>
                  <option value="Hatch Student Spaces">Hatch Student Spaces</option>
                  <option value="Hatch Student Workshop">Hatch Student Workshop</option>
                  <option value="Intramurals">Intramurals</option>
                  <option value="IT">IT</option>
                  <option value="Jumpsuit Initiative">Jumpsuit Initiative</option>
                  <option value="Kennedy (formerly called Iron Ring)">Kennedy (formerly called Iron Ring)</option>
                  <option value="Leadership Development Conference">Leadership Development Conference</option>
                  <option value="Long Term Investments">Long Term Investments</option>
                  <option value="Lounge">Lounge</option>
                  <option value="McMaster Engineering Competition">McMaster Engineering Competition</option>
                  <option value="Mentorship Program">Mentorship Program</option>
                  <option value="MES Branding">MES Branding</option>
                  <option value="MES Card Supplies">MES Card Supplies</option>
                  <option value="National Engineering Month">National Engineering Month</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Oksoberfest">Oksoberfest</option>
                  <option value="Open Conferences & Competitions">Open Conferences & Competitions</option>
                  <option value="Operational Contingency">Operational Contingency</option>
                  <option value="Operations">Operations</option>
                  <option value="Professional Development">Professional Development</option>
                  <option value="Semi Annual General Meeting">Semi Annual General Meeting</option>
                  <option value="Sports Events">Sports Events</option>
                  <option value="Spread the Love Week">Spread the Love Week</option>
                  <option value="Student Group Leadership Training">Student Group Leadership Training</option>
                  <option value="Student Projects">Student Projects</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Talent Show">Talent Show</option>
                  <option value="The Drain">The Drain</option>
                  <option value="The Event">The Event</option>
                  <option value="Town Halls">Town Halls</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Trivia Night">Trivia Night</option>
                  <option value="Tutoring Program">Tutoring Program</option>
                  <option value="Two Way Radio Frequency License">Two Way Radio Frequency License</option>
                  <option value="Website / InfraTech">Website / InfraTech</option>
                  <option value="Welcome Week">Welcome Week</option>
                  <option value="Wellness">Wellness</option>
                </select>
                {errors.budget_line && <p className="text-red-500 text-sm">{errors.budget_line.message}</p>}
              </div>
              {/* Additional sections... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(3)}
              >
                Next
              </button>
              
            </>
          )}

          {formStep === 13 && (
            <>
              <div className="mb-4">
                <label htmlFor="budget_line" className="block text-sm font-medium">Relevant Budget Line</label>
                <select
                  {...register('budget_line', { required: 'Budget line is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select budget line</option>
                  <option value="Academic Events & Info Sessions">Academic Events & Info Sessions</option>
                  <option value="Academic Resources">Academic Resources</option>
                  <option value="Accounting Software">Accounting Software</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Audit">Audit</option>
                  <option value="Awards">Awards</option>
                  <option value="B2S Week">B2S Week</option>
                  <option value="Bank Fees">Bank Fees</option>
                  <option value="Bookkeeper">Bookkeeper</option>
                  <option value="Capstone Fund">Capstone Fund</option>
                  <option value="CFES Membership">CFES Membership</option>
                  <option value="CFES Presidents' Meeting">CFES Presidents' Meeting</option>
                  <option value="Closed Conferences & Competitions">Closed Conferences & Competitions</option>
                  <option value="Clubfest">Clubfest</option>
                  <option value="Community Outreach">Community Outreach</option>
                  <option value="Coordinator Retention">Coordinator Retention</option>
                  <option value="Council Operations">Council Operations</option>
                  <option value="Culture">Culture</option>
                  <option value="Director of Events">Director of Events</option>
                  <option value="ECCS Fees">ECCS Fees</option>
                  <option value="Elections">Elections</option>
                  <option value="Engineering Competition Delegate Funding">Engineering Competition Delegate Funding</option>
                  <option value="Engineering Help Centre">Engineering Help Centre</option>
                  <option value="ESSCO Membership">ESSCO Membership</option>
                  <option value="ESSCO Ontario Engineering Competition">ESSCO Ontario Engineering Competition</option>
                  <option value="Executive Operations">Executive Operations</option>
                  <option value="Executive Planning Weekend">Executive Planning Weekend</option>
                  <option value="Faculty Frenzy">Faculty Frenzy</option>
                  <option value="Fireball">Fireball</option>
                  <option value="First Year Society">First Year Society</option>
                  <option value="Frequency">Frequency</option>
                  <option value="Frost Week">Frost Week</option>
                  <option value="Fundraising Donations">Fundraising Donations</option>
                  <option value="Handbook">Handbook</option>
                  <option value="Hatch Student Spaces">Hatch Student Spaces</option>
                  <option value="Hatch Student Workshop">Hatch Student Workshop</option>
                  <option value="Intramurals">Intramurals</option>
                  <option value="IT">IT</option>
                  <option value="Jumpsuit Initiative">Jumpsuit Initiative</option>
                  <option value="Kennedy (formerly called Iron Ring)">Kennedy (formerly called Iron Ring)</option>
                  <option value="Leadership Development Conference">Leadership Development Conference</option>
                  <option value="Long Term Investments">Long Term Investments</option>
                  <option value="Lounge">Lounge</option>
                  <option value="McMaster Engineering Competition">McMaster Engineering Competition</option>
                  <option value="Mentorship Program">Mentorship Program</option>
                  <option value="MES Branding">MES Branding</option>
                  <option value="MES Card Supplies">MES Card Supplies</option>
                  <option value="National Engineering Month">National Engineering Month</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Oksoberfest">Oksoberfest</option>
                  <option value="Open Conferences & Competitions">Open Conferences & Competitions</option>
                  <option value="Operational Contingency">Operational Contingency</option>
                  <option value="Operations">Operations</option>
                  <option value="Professional Development">Professional Development</option>
                  <option value="Semi Annual General Meeting">Semi Annual General Meeting</option>
                  <option value="Sports Events">Sports Events</option>
                  <option value="Spread the Love Week">Spread the Love Week</option>
                  <option value="Student Group Leadership Training">Student Group Leadership Training</option>
                  <option value="Student Projects">Student Projects</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Talent Show">Talent Show</option>
                  <option value="The Drain">The Drain</option>
                  <option value="The Event">The Event</option>
                  <option value="Town Halls">Town Halls</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Trivia Night">Trivia Night</option>
                  <option value="Tutoring Program">Tutoring Program</option>
                  <option value="Two Way Radio Frequency License">Two Way Radio Frequency License</option>
                  <option value="Website / InfraTech">Website / InfraTech</option>
                  <option value="Welcome Week">Welcome Week</option>
                  <option value="Wellness">Wellness</option>
                </select>
                {errors.budget_line && <p className="text-red-500 text-sm">{errors.budget_line.message}</p>}
              </div>
              {/* Additional sections... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(3)}
              >
                Next
              </button>
              
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ReimbursementForm;