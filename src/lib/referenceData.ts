import { api } from "@/services/api";
import { getCountries } from "@countrystatecity/countries-browser";
import { countries as countryDataset, currencies as currencyDataset } from "country-data-list";

export async function loadReferenceData() {
  const countries = await getCountries();

  const currencies = Object.values(currencyDataset)
    .flat()
    .map((currency) => ({
      code: currency.code,
      name: currency.name,
      symbol: currency.code,
      symbolNative: currency.code,
    }));

  const countryCurrencies = Object.fromEntries(
    countryDataset.all.map((country) => [
      country.alpha2,
      country.currencies ?? [],
    ]),
  );
  return {
    countries,
    currencies,
    countryCurrencies,
  };
}


export interface NamedOption {
  id: string;
  name: string;
}

interface IndustriesResponse {
  industries: NamedOption[];
}

interface GatewaysResponse {
  paymentgateways: NamedOption[];
}

export async function getIndustries(): Promise<NamedOption[]> {
  const { data } = await api.get<IndustriesResponse>("/api/industries");
  return data.industries;
}

export async function getGateways(): Promise<NamedOption[]> {
  const { data } = await api.get<GatewaysResponse>("/api/gateways");
  return data.paymentgateways;
}

export async function createIndustry(name: string){
  const { data } = await api.post<NamedOption>("/api/industries", {
    name,
  });

  return data;
}

export async function createGateway(name: string){
  const { data } = await api.post<NamedOption>("/api/gateways", {
    name,
  });

  return data;
}
export async function deleteIndustry(id: string) {
  return api.delete(`/api/industries/${id}`);
}

export async function deleteGateway(id: string) {
  return api.delete(`/api/gateways/${id}`);
}