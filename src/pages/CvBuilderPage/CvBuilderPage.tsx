import {
  CvBuilderPageLayout,
} from "./cvBuilder.sections";
import { useCvBuilderPageController } from "./useCvBuilderPageController";

export default function CvBuilderPage() {
  const cvBuilder = useCvBuilderPageController();

  return <CvBuilderPageLayout cvBuilder={cvBuilder} />;
}
