from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.cell(0, 10, 'Kaarigar Prototype - Sanskar\'s Track (Track C) Report', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('helvetica', 'B', 12)
        self.set_fill_color(240, 240, 240)
        self.cell(0, 10, title, 0, 1, 'L', fill=True)
        self.ln(2)

    def chapter_body(self, body):
        self.set_font('helvetica', '', 11)
        self.multi_cell(0, 7, body)
        self.ln(5)

pdf = PDF()
pdf.add_page()

pdf.chapter_title('1. Overview')
overview = (
    "Sanskar's track (Track C) is responsible for the Buyer Side, Artisan Dashboard, "
    "and the Backend Glue. This track ensures that buyers can browse artisan products, "
    "add them to a cart, and complete a payment seamlessly. It also provides a dashboard "
    "for artisans to view their orders and earnings, while providing the shared Supabase "
    "database schema and deployment configuration used by all tracks."
)
pdf.chapter_body(overview)

pdf.chapter_title('2. What Was Accomplished')
accomplishments = (
    "1. Environment & Setup: Discovered and mapped the existing HTML/JS/FastAPI codebase. "
    "Installed all backend Python dependencies and seeded the local SQLite database "
    "with 3 artisans and 6 product listings.\n\n"
    "2. UI & Aesthetics Upgrade: Replaced the standard fonts with a premium modern typography "
    "(Outfit). Adjusted border radii, refined drop shadows, and introduced glassmorphism "
    "elements to the header to make the interface feel highly professional and trustworthy.\n\n"
    "3. Micro-Animations: Added delightful animations to improve user feedback. "
    "When a user clicks 'Add to Cart', the button smoothly pops and turns green. "
    "Upon successful checkout, the success panel smoothly bounces and fades in.\n\n"
    "4. Razorpay Integration Validation: Verified the Razorpay Test Mode checkout "
    "flow, which successfully falls back to a mocked payment flow for local testing "
    "without requiring actual API keys."
)
pdf.chapter_body(accomplishments)

pdf.chapter_title('3. How It Works (Technical Details)')
technical = (
    "- Architecture: The backend is a FastAPI server that acts as a REST API and statically "
    "serves the Vanilla HTML/CSS/JS frontend located in the 'buyer' folder. No Node.js "
    "or complex build step is needed, ensuring fast iteration and easy deployment.\n\n"
    "- Catalog & Cart: The frontend (catalog.js) fetches listings from the /api/listings "
    "endpoint. Cart state is managed entirely in the browser using localStorage (cart.js), "
    "allowing buyers to navigate across pages without losing their items.\n\n"
    "- Payments & Escrow: When the buyer pays, an order is sent to /api/orders. The system "
    "holds the payment safely in escrow (status: 'paid_held'). Once the artisan delivers "
    "the item, an admin/demo click triggers /api/orders/{id}/deliver, which updates the "
    "status to 'released' and simulates a WhatsApp confirmation to the artisan.\n\n"
    "- Database (Supabase/SQLite): A shared schema.sql is provided for the production "
    "Supabase PostgreSQL database. For local development, the backend automatically uses "
    "a local SQLite database file."
)
pdf.chapter_body(technical)

pdf.output('Sanskar_Track_Report.pdf')
print("PDF generated successfully: Sanskar_Track_Report.pdf")
