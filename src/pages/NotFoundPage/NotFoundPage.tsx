import { useTranslation } from "react-i18next";

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        {t("notFound.title", "Page Not Found")}
      </h1>
      <div className="rounded-lg border bg-white p-4 text-sm text-slate-700">
        {t(
          "notFound.subtitle",
          "The page you are looking for does not exist.",
        )}
      </div>
    </div>
  );
};
export default NotFoundPage;
