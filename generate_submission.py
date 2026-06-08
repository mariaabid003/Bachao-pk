from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

doc = Document()

# ── Page margins ──────────────────────────────────────────────────────────────
for section in doc.sections:
    section.top_margin    = Cm(2.2)
    section.bottom_margin = Cm(2.2)
    section.left_margin   = Cm(2.5)
    section.right_margin  = Cm(2.5)

# ── Helpers ───────────────────────────────────────────────────────────────────
def set_font(run, name="Calibri", size=11, bold=False, italic=False, color=None):
    run.font.name  = name
    run.font.size  = Pt(size)
    run.font.bold  = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = RGBColor(*color)

def shade_cell(cell, hex_color: str):
    """Fill a table cell with a solid background colour."""
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement("w:shd")
    shd.set(qn("w:val"),   "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"),  hex_color)
    tcPr.append(shd)

def set_paragraph_shading(paragraph, hex_color: str):
    pPr  = paragraph._p.get_or_add_pPr()
    shd  = OxmlElement("w:shd")
    shd.set(qn("w:val"),   "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"),  hex_color)
    pPr.append(shd)

def heading_block(doc, number: str, title: str):
    """Dark navy section heading with coloured number accent."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after  = Pt(6)
    set_paragraph_shading(p, "0D1B2A")

    r1 = p.add_run(f"  {number}  ")
    set_font(r1, "Calibri", 13, bold=True, color=(255, 87, 34))   # deep orange accent

    r2 = p.add_run(title.upper())
    set_font(r2, "Calibri", 13, bold=True, color=(255, 255, 255))

def sub_heading(doc, text: str):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after  = Pt(3)
    r = p.add_run(text)
    set_font(r, "Calibri", 11, bold=True, color=(13, 27, 42))

def body(doc, text: str, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after  = Pt(space_after)
    p.paragraph_format.space_before = Pt(0)
    r = p.add_run(text)
    set_font(r, "Calibri", 10.5, color=(30, 30, 30))

def bullet(doc, text: str, bold_prefix: str = ""):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after  = Pt(3)
    p.paragraph_format.space_before = Pt(0)
    if bold_prefix:
        rb = p.add_run(bold_prefix)
        set_font(rb, "Calibri", 10.5, bold=True, color=(13, 27, 42))
    r = p.add_run(text)
    set_font(r, "Calibri", 10.5, color=(30, 30, 30))

def divider(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after  = Pt(2)
    set_paragraph_shading(p, "FF5722")
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(0)
    r = p.add_run(" ")
    r.font.size = Pt(4)


# ══════════════════════════════════════════════════════════════════════════════
#  COVER / HEADER
# ══════════════════════════════════════════════════════════════════════════════
# Competition badge line
badge = doc.add_paragraph()
badge.alignment = WD_ALIGN_PARAGRAPH.CENTER
badge.paragraph_format.space_before = Pt(0)
badge.paragraph_format.space_after  = Pt(4)
set_paragraph_shading(badge, "0D1B2A")
rb = badge.add_run("  SPECTRUM 26  ·  VIBE & PITCH  ·  DAY 01 QUALIFIERS  ·  JUNE 8, 2026  ·  DHA SUFFA UNIVERSITY  ")
set_font(rb, "Calibri", 9, bold=True, color=(255, 87, 34))
badge.alignment = WD_ALIGN_PARAGRAPH.CENTER

# App name
title_p = doc.add_paragraph()
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
title_p.paragraph_format.space_before = Pt(16)
title_p.paragraph_format.space_after  = Pt(4)
t1 = title_p.add_run("BACHAO")
set_font(t1, "Calibri", 42, bold=True, color=(13, 27, 42))
t2 = title_p.add_run(" PAKISTAN")
set_font(t2, "Calibri", 42, bold=False, color=(255, 87, 34))

# Tagline
tag_p = doc.add_paragraph()
tag_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
tag_p.paragraph_format.space_before = Pt(2)
tag_p.paragraph_format.space_after  = Pt(6)
tr = tag_p.add_run("Predictive Urban Safety · AI-Powered Journey Monitoring · Community Crime Intelligence")
set_font(tr, "Calibri", 11, italic=True, color=(100, 100, 100))

# Meta table (Team / Startup / Vertical / URL)
meta = doc.add_table(rows=2, cols=4)
meta.alignment = WD_TABLE_ALIGNMENT.CENTER
meta.style = "Table Grid"
labels  = ["TEAM NAME", "STARTUP NAME", "BUSINESS VERTICAL", "LIVE PRODUCT URL"]
values  = ["Team Bachao", "Bachao Pakistan", "Safety Tech / Urban Intelligence", "Coming Soon — Demo Available"]
label_bg = "0D1B2A"
value_bg = "F4F4F4"
for i, (lbl, val) in enumerate(zip(labels, values)):
    lc = meta.rows[0].cells[i]
    vc = meta.rows[1].cells[i]
    shade_cell(lc, label_bg)
    shade_cell(vc, value_bg)
    lp = lc.paragraphs[0]
    lp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    lr = lp.add_run(lbl)
    set_font(lr, "Calibri", 8, bold=True, color=(255, 87, 34))
    vp = vc.paragraphs[0]
    vp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    vr = vp.add_run(val)
    set_font(vr, "Calibri", 9, bold=False, color=(30, 30, 30))

doc.add_paragraph().paragraph_format.space_after = Pt(4)

# ── Horizontal rule ───────────────────────────────────────────────────────────
divider(doc)

# ══════════════════════════════════════════════════════════════════════════════
#  01  PROBLEM STATEMENT
# ══════════════════════════════════════════════════════════════════════════════
heading_block(doc, "01", "Problem Statement")

body(doc,
     "Karachi is a city of 22 million people and one of the world's most complex urban environments. "
     "Every day, tens of thousands of residents — students, working women, professionals, and families — "
     "travel through streets where phone snatching, vehicular robbery, and harassment are not rare events; "
     "they are routine. According to CPLC data, Karachi records over 80,000 street crimes annually, "
     "with vehicle-related incidents and mobile phone snatching accounting for the majority. "
     "Women travelling alone and motorcycle commuters are disproportionately targeted, particularly at "
     "night and in known signal blind-spots.")

body(doc,
     "When something goes wrong, the response is almost always the same: nothing — or nothing fast enough. "
     "A person being robbed cannot dial a number. A family waiting at home has no visibility. "
     "Emergency services, where reachable, arrive too late. Post-incident reporting is cumbersome and rarely "
     "leads to actionable outcomes. The only information that exists is fragmented: crime reports locked in "
     "police spreadsheets, community warnings shared informally on WhatsApp groups, and trauma held privately "
     "by victims who never reported at all.")

body(doc,
     "Three structural failures keep this problem unsolved:")
bullet(doc, "No real-time, location-aware safety intelligence exists in the hands of ordinary commuters.", "Data gap:  ")
bullet(doc, "Emergency contacts have zero visibility into a loved one's journey status until it is too late.", "Response gap:  ")
bullet(doc, "Incident data is never aggregated into predictive models that could prevent the next crime.", "Prevention gap:  ")

body(doc,
     "Existing solutions fail to bridge all three. Ride-hailing apps track location but are not a personal "
     "safety layer — they cover only a fraction of trips and do not alert contacts. Generic SOS apps send "
     "a location ping but lack route intelligence, risk scoring, or community data. Pakistan has no equivalent "
     "of the safety infrastructure that residents of other major cities take for granted.")

# ══════════════════════════════════════════════════════════════════════════════
#  02  THE TEAM
# ══════════════════════════════════════════════════════════════════════════════
heading_block(doc, "02", "The Team")

body(doc,
     "We are a student-founded team from Karachi. We built Bachao because we live this problem — "
     "not as an abstract exercise, but because people close to us have been affected by street crime. "
     "That proximity to the problem is our first and most important credential.")

body(doc,
     "What makes us the right team:")
bullet(doc,
       "We have shipped a working product. Bachao Pakistan is not a slide deck — it is a live system: "
       "a React Native mobile app, a React/Vite web dashboard, and a Python FastAPI backend with a "
       "functional ML risk engine, real GPS journey monitoring, and an AI-powered alert system. "
       "Building this as a student team demonstrates execution capability that most early-stage startups lack.",
       "Technical execution:  ")
bullet(doc,
       "We built specifically for the Karachi context: Karachi signal geographies, CPLC crime categories, "
       "Urdu-language support in the roadmap, SMS delivery over Pakistani carriers, and awareness of Karachi's "
       "dead-zone connectivity challenges. We are not adapting a Western product; we are building ground-up for this city.",
       "Contextual depth:  ")
bullet(doc,
       "This is a safety product, and our users need to trust it. As young people who travel Karachi's streets "
       "ourselves — and who understand the social dynamics around women's safety, student commutes, and family anxiety — "
       "we have authentic insight into what users need to feel, not just what they technically need.",
       "User empathy:  ")
bullet(doc,
       "The same team that identified the problem, designed the product, built the code, and is standing in "
       "front of judges today. There is no gap between vision and execution.",
       "Founder-market fit:  ")

# ══════════════════════════════════════════════════════════════════════════════
#  03  TARGET CUSTOMER / ICP
# ══════════════════════════════════════════════════════════════════════════════
heading_block(doc, "03", "Target Customer / Ideal Customer Profile")

body(doc,
     "Our primary customer is not every Karachi resident. We are deliberately specific:")

sub_heading(doc, "Primary: Young Women Commuting Independently")
body(doc,
     "Age 18–35. Students and early-career professionals. Travel by rickshaw, bike-hailing (Bykea/inDrive), "
     "or public transport. Often travelling alone in the evening. Their families demand they share live location — "
     "they want autonomy without the anxiety. They experience the problem acutely and have a strong emotional "
     "motivation to adopt a safety tool.")

sub_heading(doc, "Secondary: Motorcycle Commuters (Bikers)")
body(doc,
     "The highest-risk commuter profile in Karachi. Exposed at signals, targeted for phone and vehicle snatching. "
     "Bachao's 'Biker Mode' — which identifies high-risk signals on their route before they reach them — "
     "solves a problem no other app addresses. This demographic is large (millions of daily bikers) and "
     "underserved by digital safety tools.")

sub_heading(doc, "Tertiary: Families of Commuters")
body(doc,
     "Parents of university students, spouses of late-working professionals. They are not the app user — "
     "they are trusted contacts who receive real-time journey status and SOS alerts. Their anxiety is the "
     "purchase motivation. When a parent insists a child 'start their journey on Bachao,' the family becomes "
     "the acquisition channel.")

sub_heading(doc, "B2B Opportunity: Universities & Corporates")
body(doc,
     "Universities with large female student populations (IBA, SZABIST, DUET, Suffa) and corporates with "
     "late-shift employees are institutional buyers who would pay for Bachao as a duty-of-care service "
     "deployed to their community. This is Phase 2 of the go-to-market.")

# ══════════════════════════════════════════════════════════════════════════════
#  04  MARKET OPPORTUNITY
# ══════════════════════════════════════════════════════════════════════════════
heading_block(doc, "04", "Market Opportunity")

sub_heading(doc, "The Scale of the Problem")
body(doc,
     "Karachi has a population of approximately 22 million, making it the world's 7th largest city. "
     "Pakistan has over 190 million smartphone users and a rapidly growing mobile internet penetration rate. "
     "Urban insecurity is not a Karachi-only phenomenon — it is felt across Lahore, Islamabad, Rawalpindi, "
     "Faisalabad, and every other major Pakistani city. Beyond Pakistan, cities like Dhaka, Nairobi, "
     "Lagos, and Cairo share structurally identical problems: high urban crime rates, inadequate emergency "
     "response infrastructure, and a large mobile-first population with no adequate safety layer.")

# Market table
sub_heading(doc, "Market Sizing")
tbl = doc.add_table(rows=4, cols=3)
tbl.style = "Table Grid"
headers = ["Market", "Population / Estimate", "Basis"]
rows_data = [
    ["Total Addressable Market (TAM)",
     "~$2.8B (South & Southeast Asian urban safety tech)",
     "190M smartphone users in Pak + regional urban markets at $5 ARPU"],
    ["Serviceable Addressable Market (SAM)",
     "~$180M (Pakistani urban commuters)",
     "~36M urban adults commuting daily in major cities at $5 ARPU"],
    ["Serviceable Obtainable Market (SOM – Yr 3)",
     "~$2.4M (Karachi early adopters)",
     "~480,000 users × freemium conversion at Rs. 299/month"],
]
for i, h in enumerate(headers):
    c = tbl.rows[0].cells[i]
    shade_cell(c, "0D1B2A")
    p = c.paragraphs[0]
    r = p.add_run(h)
    set_font(r, "Calibri", 9.5, bold=True, color=(255, 87, 34))
for ri, row_data in enumerate(rows_data):
    bg = "F9F9F9" if ri % 2 == 0 else "FFFFFF"
    for ci, val in enumerate(row_data):
        c = tbl.rows[ri+1].cells[ci]
        shade_cell(c, bg)
        p = c.paragraphs[0]
        r = p.add_run(val)
        set_font(r, "Calibri", 9.5, color=(30, 30, 30))

doc.add_paragraph().paragraph_format.space_after = Pt(4)

sub_heading(doc, "Market Category")
body(doc,
     "This is an emerging category — Predictive Urban Safety as a Service. While personal safety apps exist "
     "in Western markets (Life360, bSafe, Noonlight), none are built for the Pakistani/South Asian context, "
     "which differs fundamentally: lower trust in emergency services, high mobile-first usage, different "
     "crime typologies (signal-based snatching vs. indoor crime), and community-driven intelligence networks. "
     "Bachao is first to define and occupy this category in Pakistan.")

# ══════════════════════════════════════════════════════════════════════════════
#  05  GO-TO-MARKET STRATEGY
# ══════════════════════════════════════════════════════════════════════════════
heading_block(doc, "05", "Go-To-Market Strategy")

sub_heading(doc, "Phase 1 — Community Seeding (Months 1–3)")
body(doc,
     "Launch within DHA Suffa University and 2–3 adjacent universities. "
     "Every user who sets up Bachao adds up to 3 trusted contacts — those contacts receive their first "
     "Bachao alert, and the product sells itself. We target female student communities specifically, "
     "because safety anxiety is highest and word-of-mouth is fastest within these networks.")

bullet(doc, "Campus ambassador programme: 5 students per campus, given priority access and a referral code.", "Tactic:  ")
bullet(doc, "WhatsApp group seeding through student society networks (social/cultural/sports societies).", "Tactic:  ")
bullet(doc, "Local micro-influencers (safety-focused content creators on Instagram/TikTok).", "Tactic:  ")

sub_heading(doc, "Phase 2 — Institutional B2B (Months 4–9)")
body(doc,
     "Approach university administrations and corporate HR departments as channel partners. "
     "Universities already have a duty-of-care obligation to female students. We offer Bachao as "
     "a white-label safety layer that they can deploy to their students — at zero cost initially, "
     "then on a per-seat subscription. This gives us dense user clusters in defined geographies, "
     "which improves our community incident data dramatically.")

sub_heading(doc, "Phase 3 — City-Wide Expansion (Month 10+)")
body(doc,
     "With proven traction and community crime data, approach Karachi Metropolitan Corporation and "
     "provincial government bodies (Safe City initiative) as data-licensing or co-branded partners. "
     "Expand to Lahore and Islamabad using the same campus-first playbook.")

body(doc,
     "Customer Acquisition Cost is near-zero in Phase 1 because the trusted-contact viral loop does the "
     "acquisition. Each user we onboard brings us 2–3 additional warm users with zero spend.")

# ══════════════════════════════════════════════════════════════════════════════
#  06  REVENUE MODEL AND UNIT ECONOMICS
# ══════════════════════════════════════════════════════════════════════════════
heading_block(doc, "06", "Revenue Model and Unit Economics")

sub_heading(doc, "Revenue Streams")
bullet(doc,
       "Free core app with basic journey monitoring. Rs. 299/month (~$1.10 USD) for Premium: "
       "AI safety briefs, journey history, offline mode, priority SOS, advanced risk reports.",
       "B2C Freemium Subscription:  ")
bullet(doc,
       "Universities and corporates pay Rs. 50–100/user/month for bulk-licensed, admin-dashboard-enabled "
       "deployment across their student or staff population.",
       "B2B Institutional Licensing:  ")
bullet(doc,
       "Aggregated, anonymised crime heatmap and mobility data sold to urban planners, insurance companies, "
       "and logistics firms. No personally identifiable information is ever shared.",
       "Data Intelligence (Phase 3):  ")
bullet(doc,
       "Geo-targeted safety tips, navigation prompts, and relevant services (insurance, emergency services) "
       "in high-risk corridor notifications.",
       "Contextual In-App Advertising (Phase 3):  ")

sub_heading(doc, "Unit Economics (12-Month Projection)")
ue_tbl = doc.add_table(rows=6, cols=2)
ue_tbl.style = "Table Grid"
ue_data = [
    ("Monthly Active Users (Month 12 target)", "50,000"),
    ("Freemium Conversion Rate", "8% → 4,000 paying users"),
    ("Average Revenue Per Paying User", "Rs. 299 / month (~$1.10)"),
    ("Monthly Recurring Revenue (MRR) at target", "Rs. 1,196,000 (~$4,300)"),
    ("Estimated Monthly Operating Cost (cloud + SMS + AI)", "Rs. 150,000 (~$540)"),
    ("Gross Margin at target", "~87%"),
]
for ri, (k, v) in enumerate(ue_data):
    bg = "F0F4FF" if ri % 2 == 0 else "FFFFFF"
    kc = ue_tbl.rows[ri].cells[0]
    vc = ue_tbl.rows[ri].cells[1]
    shade_cell(kc, "0D1B2A" if ri == 0 else bg)
    shade_cell(vc, "0D1B2A" if ri == 0 else bg)
    color = (255, 87, 34) if ri == 0 else (30, 30, 30)
    bold  = ri == 0
    kp = kc.paragraphs[0]; kr = kp.add_run(k); set_font(kr, "Calibri", 9.5, bold=bold, color=color)
    vp = vc.paragraphs[0]; vr = vp.add_run(v); set_font(vr, "Calibri", 9.5, bold=bold, color=color)

doc.add_paragraph().paragraph_format.space_after = Pt(4)
body(doc,
     "The business is capital-light. Infrastructure costs scale with usage but remain marginal relative "
     "to subscription revenue. The biggest cost is SMS/call delivery via Twilio for SOS alerts — "
     "a cost that only triggers upon real emergencies, maintaining healthy unit economics even at scale.")

# ══════════════════════════════════════════════════════════════════════════════
#  07  INNOVATION AND COMPETITIVE EDGE
# ══════════════════════════════════════════════════════════════════════════════
heading_block(doc, "07", "Innovation and Competitive Edge")

sub_heading(doc, "What Makes Bachao Different")
bullet(doc,
       "Bachao does not just sound an alarm — it predicts risk before the journey begins. "
       "Our ML risk engine scores each route using historical crime patterns, time of day, "
       "day of week, weather, and area-specific CPLC incident data. Users know which route is "
       "safer before they leave the house.",
       "Predictive, not reactive:  ")
bullet(doc,
       "We are the only safety product that identifies which specific traffic signals on a route "
       "carry elevated robbery risk — giving bikers real, actionable intelligence ('Avoid Teen Talwar "
       "Signal tonight — 4 incidents in the last week').",
       "Signal-aware biker mode:  ")
bullet(doc,
       "DBSCAN clustering on community-reported incidents creates evolving hotspot maps that get "
       "smarter with every user report. The more users we have, the better the safety intelligence "
       "becomes — a classic data network effect that competitors cannot easily replicate.",
       "Community intelligence flywheel:  ")
bullet(doc,
       "If a user deviates from their planned route, stops unexpectedly, or fails to confirm safe "
       "arrival, the system autonomously triggers a cascading alert: SMS + voice call to trusted "
       "contacts. This requires zero user action — critical in a moment of actual danger.",
       "Autonomous SOS with no user action required:  ")
bullet(doc,
       "Unlike generic safety apps (Life360, bSafe), Bachao is designed entirely around Pakistani "
       "urban crime realities: signal snatching, rickshaw and ride-hailing safety, family check-in "
       "culture, Urdu language, and Pakistani SMS delivery infrastructure.",
       "Pakistan-native context:  ")

sub_heading(doc, "What Makes This Hard to Replicate")
body(doc,
     "Bachao's moat deepens with usage. The community crime data — every incident reported, every "
     "journey that triggered an anomaly — is proprietary training data that makes our risk engine "
     "more accurate over time. A competitor entering the market today starts with no data. After "
     "12 months of Bachao operation in Karachi, they start 12 months of ground truth behind. "
     "Additionally, the trusted-contact network creates strong retention: when 3 family members "
     "are embedded in a user's safety loop, switching cost is very high.")

# ══════════════════════════════════════════════════════════════════════════════
#  08  VALIDATION AND CURRENT STATUS
# ══════════════════════════════════════════════════════════════════════════════
heading_block(doc, "08", "Validation and Current Status")

sub_heading(doc, "What We Have Built")
body(doc,
     "Bachao Pakistan is a fully functional product with three live components:")
bullet(doc,
       "React Native (Expo) app with 8 complete screens: onboarding, home dashboard, journey setup, "
       "risk result with AI brief, live journey monitoring, safe arrival, signal map, and community "
       "incident reporting.",
       "Mobile App:  ")
bullet(doc,
       "Python FastAPI backend with 12 REST endpoints, a RandomForest ML risk scorer, DBSCAN hotspot "
       "clustering, route deviation detection (Shapely geometry), stop anomaly detection, and a "
       "Twilio-powered SOS call + SMS pipeline.",
       "Backend:  ")
bullet(doc,
       "React/Vite admin and public dashboard with a live Leaflet.js crime heatmap, signal risk map, "
       "and incident feed.",
       "Web Dashboard:  ")

sub_heading(doc, "Technical Validation")
bullet(doc, "ML risk engine operational: RandomForest classifier scoring routes by risk level, trained on simulated Karachi crime data pending real CPLC data integration.", "Risk engine:  ")
bullet(doc, "Route deviation detection working using Shapely geometric comparison against OSRM-generated polylines.", "Journey monitoring:  ")
bullet(doc, "3-shake SOS trigger (accelerometer) functional on Android.", "SOS trigger:  ")
bullet(doc, "GPS poller pinging backend every 30 seconds during active journeys.", "Location services:  ")
bullet(doc, "AI safety brief generation via Claude Haiku API — personalised per route, time of day, and area.", "AI integration:  ")

sub_heading(doc, "Market Validation")
bullet(doc,
       "Every member of our team and extended network who we demoed the app to confirmed they would use it. "
       "Women in our network specifically said they had been looking for exactly this kind of product and "
       "were frustrated that nothing adequate existed in Pakistan.",
       "Problem resonance:  ")
bullet(doc,
       "We identified that universities in Karachi have no formal journey safety tool for students. "
       "The gap is institutional as well as personal — confirming the B2B channel hypothesis.",
       "Institutional gap:  ")
bullet(doc,
       "Ride-hailing and mapping apps (Bykea, Google Maps) do not provide safety risk scoring, "
       "trusted-contact journey monitoring, or signal-specific warnings — confirming Bachao occupies "
       "an unaddressed space, not a crowded one.",
       "Competitive gap:  ")

sub_heading(doc, "Next Milestones")
bullet(doc, "Beta launch with 50 users across 3 Karachi university campuses")
bullet(doc, "Integrate real CPLC crime data to replace simulated training data")
bullet(doc, "Complete Twilio SMS delivery for Pakistani numbers and lock down Firebase security rules")
bullet(doc, "Approach 3 university administrations for B2B pilot conversations")
bullet(doc, "Publish to Google Play Store internal testing track")

# ── Final divider ─────────────────────────────────────────────────────────────
divider(doc)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(10)
r = p.add_run("Bachao Pakistan  ·  SPECTRUM 26 Submission  ·  June 8, 2026")
set_font(r, "Calibri", 9, italic=True, color=(130, 130, 130))

# ── Save ──────────────────────────────────────────────────────────────────────
out_path = r"c:\Users\maria\All my 4 year of projects\Bachao\SPECTRUM26_Bachao_Pakistan_Submission.docx"
doc.save(out_path)
print(f"Document saved -> {out_path}")
