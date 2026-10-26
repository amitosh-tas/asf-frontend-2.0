import { useEffect, useState } from "react";

// import {
//   getCountries,
//   getCountryTimezones,
// } from "@countrystatecity/countries-browser";

// import {
//   countries as countryDataset,
//   currencies as currencyDataset,
// } from "country-data-list";

import { getCountryTimezones } from "@countrystatecity/countries-browser";
import { 
  // createGateway, 
  // createIndustry, 
  // getGateways,
  getIndustries, 
  loadReferenceData 
} from "@/lib/referenceData";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";

interface NamedOption {
  id: string;
  name: string;
}

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  symbolNative?: string;
}

export interface CompanyDetailsValues {
  name: string;
  country: string;
  industry: string;
  timezone: string;
  dataRegion: string;
  currency: string;
  // paymentMethod: string;
}

interface CompanyDetailsFieldsProps {
  values: CompanyDetailsValues;
  onChange: (
    field: keyof CompanyDetailsValues,
    value: string,
  ) => void;
}

const DATA_REGIONS = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "EU", label: "European Union" },
  { value: "UK", label: "United Kingdom" },
  { value: "APAC", label: "Asia Pacific" },
];

const TIMEZONES =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC"];

export default function CompanyDetailsFields({
  values,
  onChange,
}: CompanyDetailsFieldsProps) {
  const [countryCurrencies, setCountryCurrencies] = useState<
    Record<string, string[]>
  >({});

  type ReferenceData = Awaited<ReturnType<typeof loadReferenceData>>;

  const [countries, setCountries] = useState<ReferenceData["countries"]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [countryTimezones, setCountryTimezones] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [industries, setIndustries] = useState<NamedOption[]>([]);
  // const [gateways, setGateways] = useState<NamedOption[]>([]);
  const [loadingNamedOptions, setLoadingNamedOptions] = useState(true);
  // const [namedOptionsError, setNamedOptionsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadNamedOptions() {
      try {
        const [
          industryData, 
          // gatewayData
        ] = await Promise.all([
          getIndustries(),
          // getGateways(),
        ]);

        if (cancelled) return;

        setIndustries(industryData);
        // setGateways(gatewayData);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load industries and gateways:", error);
        // setNamedOptionsError(true);
      } finally {
        if (!cancelled) setLoadingNamedOptions(false);
      }
    }

    void loadNamedOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!values.country || loadingOptions || optionsError) return;

    void handleCountryChange(values.country);
  }, [values.country, loadingOptions, optionsError]);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const {
          countries: countryData,
          currencies: currencyData,
          countryCurrencies: currencyMap,
        } = await loadReferenceData();

        if (cancelled) return;

        setCountries(
          [...countryData].sort((a, b) => a.name.localeCompare(b.name)),
        );

        setCurrencies(
          [...currencyData].sort((a, b) => a.code.localeCompare(b.code)),
        );

        setCountryCurrencies(currencyMap);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load reference data:", error);
        setOptionsError(true);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCountryChange(countryCode: string) {
    onChange("country", countryCode);

    if (!countryCode) {
      setCountryTimezones([]);
      return;
    }

    try {
      const timezones = await getCountryTimezones(countryCode);

      setCountryTimezones(timezones);

      const countryCurrencyCodes = countryCurrencies[countryCode] ?? [];

      const matchingCurrency = currencies.find((currency) =>
        countryCurrencyCodes.includes(currency.code),
      );

      if (matchingCurrency) {
        onChange("currency", matchingCurrency.code);
      }
      if (
        timezones.length > 0 &&
        !timezones.includes(values.timezone)
      ) {
        onChange("timezone", timezones[0]);
      }
    } catch (error) {
      console.error("Failed to load country-specific options:", error);
    }
  }

  const availableTimezones =
    countryTimezones.length > 0
      ? countryTimezones
      : TIMEZONES;

  return (
    <>
      <section className="flex flex-col gap-5">
        <div>
          <h2 className="font-heading text-base font-semibold tracking-tight text-text">
            Company details
          </h2>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            Tell us about the business you're managing.
          </p>
        </div>

        <FormField label="Company name *" htmlFor="company-name">
          <Input
            id="company-name"
            name="name"
            required
            value={values.name}
            onChange={(event) =>
              onChange("name", event.target.value)
            }
            autoComplete="organization"
            placeholder="Your company name"
          />
        </FormField>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <FormField label="Country *" htmlFor="company-country">
            <Select
              id="company-country"
              name="country"
              required
              value={values.country}
              disabled={loadingOptions || optionsError}
              onChange={(event) =>
                void handleCountryChange(event.target.value)
              }
            >
              <option value="" disabled>
                {loadingOptions
                  ? "Loading countries..."
                  : "Select country"}
              </option>

              {countries.map((country) => (
                <option key={country.iso2} value={country.iso2}>
                  {country.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Industry *" htmlFor="company-industry">
            <Select
              id="company-industry"
              name="industry"
              required
              value={values.industry}
              onChange={(event) =>
                onChange("industry", event.target.value)
              }
            >

              <option value="" disabled>
                {loadingNamedOptions ? "Loading industries..." : "Select industry"}
              </option>

              {industries.map((industry) => (
                <option key={industry.id} value={industry.name}>
                  {industry.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {optionsError && (
          <p role="alert" className="text-sm text-red-500">
            Failed to load country and currency options. Please refresh
            the page and try again.
          </p>
        )}
      </section>

      <div className="h-px bg-border" />

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="font-heading text-base font-semibold tracking-tight text-text">
            Regional configuration
          </h2>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            Configure how revenue and company data are handled.
          </p>
        </div>

        <FormField label="Timezone *" htmlFor="company-timezone">
          <Select
            id="company-timezone"
            name="timezone"
            required
            value={values.timezone}
            onChange={(event) =>
              onChange("timezone", event.target.value)
            }
          >
            <option value="" disabled>
              Select timezone
            </option>

            {availableTimezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <FormField
            label="Data region *"
            htmlFor="company-data-region"
          // hint="Availability depends on your backend infrastructure."
          >
            <Select
              id="company-data-region"
              name="dataRegion"
              required
              value={values.dataRegion}
              onChange={(event) =>
                onChange("dataRegion", event.target.value)
              }
            >
              <option value="" disabled>
                Select data region
              </option>

              {DATA_REGIONS.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Reporting currency *"
            htmlFor="company-currency"
          >
            <Select
              id="company-currency"
              name="currency"
              required
              value={values.currency}
              disabled={loadingOptions || optionsError}
              onChange={(event) =>
                onChange("currency", event.target.value)
              }
            >
              <option value="" disabled>
                {loadingOptions
                  ? "Loading currencies..."
                  : "Select currency"}
              </option>

              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currency.name} (
                  {currency.symbolNative || currency.symbol})
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </section>

      {/* <FormField label="Payment gateway" htmlFor="company-payment-method">
        <Select
          id="company-payment-method"
          name="paymentMethod"
          required
          value={values.paymentMethod}
          disabled={loadingNamedOptions || namedOptionsError}
          onChange={(event) => onChange("paymentMethod", event.target.value)}
        >
          <option value="" disabled>
            {loadingNamedOptions ? "Loading gateways..." : "Select gateway"}
          </option>

          {gateways.map((gateway) => (
            <option key={gateway.id} value={gateway.name}>
              {gateway.name}
            </option>
          ))}
        </Select>
      </FormField> */}
    </>
  );
}