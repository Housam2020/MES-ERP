"use client";

export default function Footer() {
  return (
    <footer className="bg-[#7A003C] dark:bg-[#1A365D] text-white py-4">
      <div className="container mx-auto px-4 text-center space-y-4">
        {/* Contact Section */}
        <div>
          <a
            href="mailto:alamourh@mcmaster.ca"
            className="text-sm underline hover:text-gray-200 transition"
          >
            Contact Our Team
          </a>
        </div>

        {/* Social Media Links */}
        <div className="flex justify-center space-x-3">
          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/company/mcmaster-engineering-society/posts/?feedView=all"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="LinkedIn"
          >
            <svg
              fill="currentColor"
              viewBox="0 0 448 512"
              height="16"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 
                0 83.5 0 53.8a53.79 53.79 0 0 1 
                107.58 0c0 29.7-24.1 54.3-53.79 
                54.3zM447.9 448h-92.68V302.4c0-34.7
                -.7-79.2-48.29-79.2-48.29 0-55.69 
                37.7-55.69 76.7V448h-92.78V148.9h89.08
                v40.8h1.3c12.4-23.5 42.69-48.3 87.88
                -48.3 94 0 111.28 61.9 111.28 
                142.3V448z" />
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/macengsociety/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="Instagram"
          >
            <svg
              fill="currentColor"
              viewBox="0 0 448 512"
              height="16"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 
                114.9s51.3 114.9 114.9 114.9S339 
                319.5 339 255.9 287.7 141 224.1 
                141zm0 189.6c-41.1 0-74.7-33.5-74.7
                -74.7s33.5-74.7 74.7-74.7 74.7 
                33.5 74.7 74.7-33.6 74.7-74.7 
                74.7zm146.4-194.3c0 14.9-12 26.8
                -26.8 26.8-14.9 0-26.8-12-26.8
                -26.8s12-26.8 26.8-26.8 26.8 
                12 26.8 26.8zm76.1 27.2c-1.7
                -35.9-9.9-67.7-36.2-93.9-26.2
                -26.2-58-34.4-93.9-36.2-37
                -2.1-147.9-2.1-184.9 0-35.8 
                1.7-67.6 9.9-93.9 36.1s-34.4 
                58-36.2 93.9c-2.1 37-2.1 
                147.9 0 184.9 1.7 35.9 9.9 
                67.7 36.2 93.9s58 34.4 93.9 
                36.2c37 2.1 147.9 2.1 184.9 
                0 35.9-1.7 67.7-9.9 93.9-36.2 
                26.2-26.2 34.4-58 36.2-93.9 
                2.1-37 2.1-147.8 0-184.8z" />
            </svg>
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/MacEngSociety/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="Facebook"
          >
            <svg
              fill="currentColor"
              viewBox="0 0 320 512"
              height="16"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 
                12.42-50.06 52.24-50.06h40.42V6.26S260.43 
                0 225.36 0c-73.22 0-121.08 44.38-121.08 
                124.72v70.62H22.89V288h81.39v224h100.17V288z" />
            </svg>
          </a>
        </div>

        {/* Footer Text */}
        <div className="text-xs pt-2 border-t border-white/10">
          <p>© 2025 McMaster Engineering Society</p>
        </div>
      </div>
    </footer>
  );
}