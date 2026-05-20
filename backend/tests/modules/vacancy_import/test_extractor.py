from __future__ import annotations

from app.modules.vacancy_import.extractor import extract_vacancy_preview


def test_extract_vacancy_preview_prefers_json_ld_jobposting() -> None:
    html = """
    <html><head>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": "Frontend Developer",
        "hiringOrganization": {"@type": "Organization", "name": "Acme GmbH"},
        "jobLocation": {"@type": "Place", "address": {
          "addressLocality": "Berlin", "addressCountry": "DE"
        }},
        "description": "<p>Build TypeScript interfaces.</p>"
      }
      </script>
    </head><body></body></html>
    """

    preview = extract_vacancy_preview("https://jobs.example.com/frontend", html)

    assert preview.source_url == "https://jobs.example.com/frontend"
    assert preview.source == "jobs.example.com"
    assert preview.company_name == "Acme GmbH"
    assert preview.role_title == "Frontend Developer"
    assert preview.location_text == "Berlin, DE"
    assert preview.vacancy_description == "Build TypeScript interfaces."
    assert preview.confidence["role_title"] == 0.95


def test_extract_vacancy_preview_uses_meta_title_fallback() -> None:
    html = """
    <html><head>
      <meta property="og:title" content="Backend Engineer at Example AG" />
      <meta property="og:site_name" content="Example Jobs" />
      <meta name="description" content="Work on APIs and PostgreSQL." />
    </head><body><main>Visible vacancy body</main></body></html>
    """

    preview = extract_vacancy_preview("https://example.com/careers/backend", html)

    assert preview.role_title == "Backend Engineer at Example AG"
    assert preview.company_name == "Example Jobs"
    assert preview.vacancy_description == "Work on APIs and PostgreSQL."
    assert "No JSON-LD JobPosting block found" in preview.warnings[0]
