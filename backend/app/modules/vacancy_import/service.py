from __future__ import annotations

from app.modules.vacancy_import.extractor import extract_vacancy_preview
from app.modules.vacancy_import.fetcher import fetch_vacancy_html
from app.modules.vacancy_import.schemas import VacancyImportPreviewResponse
from app.modules.vacancy_import.validation import validate_vacancy_import_url


class VacancyImportService:
    async def preview(self, url: str) -> VacancyImportPreviewResponse:
        validated_url = validate_vacancy_import_url(url)
        markup = await fetch_vacancy_html(validated_url)
        return extract_vacancy_preview(validated_url, markup)


def get_vacancy_import_service() -> VacancyImportService:
    return VacancyImportService()
