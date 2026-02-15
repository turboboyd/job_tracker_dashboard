import { deleteQueryParam, getQueryParam, setQueryParam } from "./queryParams";

export type ModalRouteConfig = {
  key?: string; // default: "modal"
};

const DEFAULT_KEY = "modal";

export function isModalOpen(search: string, modalName: string, config?: ModalRouteConfig): boolean {
  const key = config?.key ?? DEFAULT_KEY;
  return getQueryParam(search, key) === modalName;
}

export function openModalSearch(
  search: string,
  modalName: string,
  config?: ModalRouteConfig
): string {
  const key = config?.key ?? DEFAULT_KEY;
  return setQueryParam(search, key, modalName);
}

export function closeModalSearch(search: string, config?: ModalRouteConfig): string {
  const key = config?.key ?? DEFAULT_KEY;
  return deleteQueryParam(search, key);
}

export function buildModalHref(
  pathname: string,
  search: string,
  modalName: string,
  config?: ModalRouteConfig
): string {
  return `${pathname}${openModalSearch(search, modalName, config)}`;
}
