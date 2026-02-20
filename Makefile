.PHONY: help scrape scrape-maps scrape-history scrape-news scrape-archive \
	scrape-museum scrape-cemetery scrape-memorial-book scrape-videos \
	scrape-about scrape-goals scrape-org-structure scrape-milestones \
	scrape-related-sites scrape-past-ceremonies \
	scrape-memorial-74 scrape-memorial-80 scrape-memorial-81 scrape-memorial-82 \
	scrape-memorial-2022 scrape-memorial-poland-2023 scrape-scientific-conference \
	scrape-torah-2016

help:
	@echo "Bialystok Site - Scrape Targets"
	@echo "================================"
	@echo ""
	@echo "Generic scrape target:"
	@echo "  make scrape URL='<url>' ID='<post-id>'"
	@echo ""
	@echo "Content pages:"
	@echo "  make scrape-maps"
	@echo "  make scrape-history"
	@echo "  make scrape-news"
	@echo "  make scrape-archive"
	@echo "  make scrape-museum"
	@echo "  make scrape-cemetery"
	@echo "  make scrape-memorial-book"
	@echo "  make scrape-videos"
	@echo ""
	@echo "About section:"
	@echo "  make scrape-about"
	@echo "  make scrape-goals"
	@echo "  make scrape-org-structure"
	@echo "  make scrape-milestones"
	@echo ""
	@echo "Other pages:"
	@echo "  make scrape-related-sites"
	@echo "  make scrape-past-ceremonies"
	@echo ""
	@echo "Event/Memorial pages:"
	@echo "  make scrape-memorial-74"
	@echo "  make scrape-memorial-80"
	@echo "  make scrape-memorial-81"
	@echo "  make scrape-memorial-82"
	@echo "  make scrape-memorial-2022"
	@echo "  make scrape-memorial-poland-2023"
	@echo "  make scrape-scientific-conference"
	@echo "  make scrape-torah-2016"
	@echo ""
	@echo "Example:"
	@echo "  make scrape URL='https://www.example.com/page' ID='my-page-id'"

scrape:
	@if [ -z "$(URL)" ] || [ -z "$(ID)" ]; then \
		echo "Error: URL and ID are required"; \
		echo "Usage: make scrape URL='<url>' ID='<post-id>'"; \
		exit 1; \
	fi
	npx tsx scripts/scrape-page.ts "$(URL)" "$(ID)"

# ===================== CONTENT PAGES =====================
scrape-maps:
	npx tsx scripts/scrape-page.ts "https://www.bialystokvicinityexpatsisrael.org.il/%D7%9E%D7%A4%D7%AA-%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7" maps

scrape-history:
	npx tsx scripts/scrape-page.ts "https://www.bialystokvicinityexpatsisrael.org.il/%D7%AA%D7%95%D7%9C%D7%93%D7%95%D7%AA-%D7%99%D7%94%D7%95%D7%93%D7%99-%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7" history

scrape-news:
	@echo "To scrape news page, use: make scrape URL='<url>' ID='news'"

scrape-archive:
	@echo "To scrape archive page, use: make scrape URL='<url>' ID='archive'"

scrape-museum:
	@echo "To scrape museum page, use: make scrape URL='<url>' ID='museum'"

scrape-cemetery:
	@echo "To scrape cemetery page, use: make scrape URL='<url>' ID='cemetery'"

scrape-memorial-book:
	@echo "To scrape memorial-book page, use: make scrape URL='<url>' ID='memorial-book'"

scrape-videos:
	@echo "To scrape videos page, use: make scrape URL='<url>' ID='videos'"

# ===================== ABOUT SECTION =====================
scrape-about:
	@echo "To scrape about page, use: make scrape URL='<url>' ID='about'"

scrape-goals:
	@echo "To scrape goals page, use: make scrape URL='<url>' ID='goals'"

scrape-org-structure:
	@echo "To scrape org-structure page, use: make scrape URL='<url>' ID='org-structure'"

scrape-milestones:
	@echo "To scrape milestones page, use: make scrape URL='<url>' ID='milestones'"

# ===================== OTHER PAGES =====================
scrape-related-sites:
	@echo "To scrape related-sites page, use: make scrape URL='<url>' ID='related-sites'"

scrape-past-ceremonies:
	@echo "To scrape past-ceremonies page, use: make scrape URL='<url>' ID='past-ceremonies'"

# ===================== EVENTS / MEMORIALS =====================
scrape-memorial-74:
	@echo "To scrape memorial-74 page, use: make scrape URL='<url>' ID='memorial-74'"

scrape-memorial-80:
	@echo "To scrape memorial-80 page, use: make scrape URL='<url>' ID='memorial-80'"

scrape-memorial-81:
	@echo "To scrape memorial-81 page, use: make scrape URL='<url>' ID='memorial-81'"

scrape-memorial-82:
	@echo "To scrape memorial-82 page, use: make scrape URL='<url>' ID='memorial-82'"

scrape-memorial-2022:
	@echo "To scrape memorial-2022 page, use: make scrape URL='<url>' ID='memorial-2022'"

scrape-memorial-poland-2023:
	@echo "To scrape memorial-poland-2023 page, use: make scrape URL='<url>' ID='memorial-poland-2023'"

scrape-scientific-conference:
	@echo "To scrape scientific-conference-2010 page, use: make scrape URL='<url>' ID='scientific-conference-2010'"

scrape-torah-2016:
	@echo "To scrape torah-2016 page, use: make scrape URL='<url>' ID='torah-2016'"
