"use client";
import React from "react";
import { useFormContext } from "./ReimbursementFormContext";

const RoleBudgetSection = () => {
  const {
    methods: { register, formState: { errors } }
  } = useFormContext();

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Role & Budget Information</h2>
      <div className="mb-4">
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Role
        </label>
        <select
          {...register("role", { required: "Role is required" })}
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
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
          <option value="Program Representative, Bachelor of Technology">
            Program Representative, Bachelor of Technology
          </option>
          <option value="Program Representative, Chemical Engineering">
            Program Representative, Chemical Engineering
          </option>
          <option value="Program Representative, Civil Engineering">
            Program Representative, Civil Engineering
          </option>
          <option value="Program Representative, Computer Science">
            Program Representative, Computer Science
          </option>
          <option value="Program Representative, Electrical and Computer Engineering">
            Program Representative, Electrical and Computer Engineering
          </option>
          <option value="Program Representative, Engineering and Management">
            Program Representative, Engineering and Management
          </option>
          <option value="Program Representative, Engineering and Society">
            Program Representative, Engineering and Society
          </option>
          <option value="Program Representative, Engineering Physics">
            Program Representative, Engineering Physics
          </option>
          <option value="Program Representative, Integrated Biomedical Engineering & Health Sciences">
            Program Representative, Integrated Biomedical Engineering & Health Sciences
          </option>
          <option value="Program Representative, Materials Science and Engineering">
            Program Representative, Materials Science and Engineering
          </option>
          <option value="Program Representative, Mechanical Engineering">
            Program Representative, Mechanical Engineering
          </option>
          <option value="Program Representative, Mechatronics Engineering">
            Program Representative, Mechatronics Engineering
          </option>
          <option value="Program Representative, Software Engineering">
            Program Representative, Software Engineering
          </option>
          <option value="Vice President, Academic">Vice President, Academic</option>
          <option value="Vice President, Communications">Vice President, Communications</option>
          <option value="Vice President, External Relations">Vice President, External Relations</option>
          <option value="Vice President, Finance">Vice President, Finance</option>
          <option value="Vice President, Internal">Vice President, Internal</option>
          <option value="Vice President, Student Life">Vice President, Student Life</option>
          <option value="President">President</option>
        </select>
        {errors.role && (
          <p className="text-red-500 text-sm dark:text-red-400">{errors.role.message}</p>
        )}
      </div>
      <div className="mb-4">
        <label htmlFor="budget_line" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Relevant Budget Line
        </label>
        <select
          {...register("budget_line", { required: "Budget line is required" })}
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
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
        {errors.budget_line && (
          <p className="text-red-500 text-sm dark:text-red-400">{errors.budget_line.message}</p>
        )}
      </div>
    </div>
  );
};

export default RoleBudgetSection;
