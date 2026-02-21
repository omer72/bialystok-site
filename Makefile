.PHONY: help scrape scrape-maps scrape-history scrape-news scrape-archive \
	scrape-museum scrape-cemetery scrape-memorial-book scrape-videos \
	scrape-about scrape-goals scrape-org-structure scrape-milestones \
	scrape-related-sites scrape-past-ceremonies \
	scrape-memorial-74 scrape-memorial-80 scrape-memorial-81 scrape-memorial-82 \
	scrape-memorial-2022 scrape-memorial-poland-2023 scrape-scientific-conference \
	scrape-torah-2016 scrape-blog scrape-blog-post scrape-all-blog-posts

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
	@echo "Blog posts (Survivor Stories):"
	@echo "  make scrape-blog             # Scrape main blog list page"
	@echo "  make scrape-blog-post POST_ID='<id>' HEBREW_NAME='<hebrew-name>'"
	@echo "  make scrape-all-blog-posts   # Scrape all 22 blog posts (slow)"
	@echo ""
	@echo "Example:"
	@echo "  make scrape URL='https://www.example.com/page' ID='my-page-id'"
	@echo "  make scrape-blog-post POST_ID='yitzhak-broida' HEBREW_NAME='יצחק-ברויידה'"

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
	npx tsx scripts/scrape-page.ts "https://www.bialystokvicinityexpatsisrael.org.il/%D7%9E%D7%98%D7%A8%D7%95%D7%AA-%D7%94%D7%A2%D7%9E%D7%95%D7%AA%D7%94" 'goals'

scrape-org-structure:
	npx tsx scripts/scrape-page.ts "https://www.bialystokvicinityexpatsisrael.org.il/%D7%9E%D7%91%D7%A0%D7%94-%D7%90%D7%99%D7%A8%D7%92%D7%95%D7%A0%D7%99-%D7%A9%D7%9C-%D7%94%D7%A2%D7%9E%D7%95%D7%AA%D7%94" 'org-structure'

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
	npx tsx scripts/scrape-page.ts https://www.bialystokvicinityexpatsisrael.org.il/%D7%98%D7%9B%D7%A1-%D7%90%D7%96%D7%9B%D7%A8%D7%94-%D7%94-81-29-8-24-%D7%91%D7%99%D7%94%D7%95%D7%93 'memorial-81'

scrape-memorial-82:
	npx tsx scripts/scrape-page.ts 'https://www.bialystokvicinityexpatsisrael.org.il/%D7%98%D7%9B%D7%A1-%D7%90%D7%96%D7%9B%D7%A8%D7%94-%D7%94-82-21-8-25-%D7%91%D7%99%D7%94%D7%95%D7%93' 'memorial-82'

scrape-memorial-2022:
	npx tsx scripts/scrape-page.ts 'https://www.bialystokvicinityexpatsisrael.org.il/%D7%98%D7%9B%D7%A1-%D7%90%D7%96%D7%9B%D7%A8%D7%94-2022-%D7%91%D7%99%D7%94%D7%95%D7%93' 'memorial-2022'

scrape-memorial-poland-2023:
	npx tsx scripts/scrape-page.ts 'https://www.bialystokvicinityexpatsisrael.org.il/%D7%90%D7%96%D7%9B%D7%A8%D7%94-5-2-23-%D7%91%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7-%D7%A4%D7%95%D7%9C%D7%99%D7%9F' 'memorial-poland-2023'

scrape-scientific-conference:
	npx tsx scripts/scrape-page.ts 'https://www.bialystokvicinityexpatsisrael.org.il/%D7%9B%D7%A0%D7%A1-%D7%9E%D7%93%D7%A2%D7%99-%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7-%D7%9B%D7%9E%D7%95%D7%93%D7%9C-11-2010' 'scientific-conference-2010'

scrape-torah-2016:
	npx tsx scripts/scrape-page.ts 'https://www.bialystokvicinityexpatsisrael.org.il/%D7%94%D7%9B%D7%A0%D7%A1%D7%AA-%D7%A1%D7%A4%D7%A8-%D7%AA%D7%95%D7%A8%D7%94-2016' 'torah-2016'

# ===================== BLOG POSTS / SURVIVOR STORIES =====================
scrape-blog:
	npx tsx scripts/scrape-page.ts 'https://www.bialystokvicinityexpatsisrael.org.il/blog' 'survivor-stories'

scrape-blog-post:
	@if [ -z "$(POST_ID)" ] || [ -z "$(HEBREW_NAME)" ]; then \
		echo "Error: POST_ID and HEBREW_NAME are required"; \
		echo "Usage: make scrape-blog-post POST_ID='<id>' HEBREW_NAME='<hebrew-name>'"; \
		echo "Example: make scrape-blog-post POST_ID='yitzhak-broida' HEBREW_NAME='יצחק-ברויידה'"; \
		exit 1; \
	fi
	node -e "console.log(encodeURIComponent('$(HEBREW_NAME)'))" | xargs -I {} npx tsx scripts/scrape-page.ts 'https://www.bialystokvicinityexpatsisrael.org.il/post/{}' '$(POST_ID)'

scrape-all-blog-posts:
	npx tsx scripts/scrape-all-blog-posts.ts
