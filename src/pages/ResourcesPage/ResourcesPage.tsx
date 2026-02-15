import { useTranslation } from "react-i18next";

const ResourcesPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("resources.title", "Resources")}</h1>
      <div className="rounded-lg border bg-white p-4 text-sm text-slate-700">
        {t("resources.subtitle", "This is the Resources page.")}
      </div>
    </div>
  );
};

export default ResourcesPage;
