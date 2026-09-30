//@ts-ignore
import WAValidator from "multicoin-address-validator";

type SupportedCurrency = "BTC" | "LTC" | "DASH" | "BCH" | "ETH" | "USDT" | "USDC";
type ValidatorNetwork = "prod" | "testnet";

const VALIDATOR_TARGETS: Record<
  SupportedCurrency,
  { libraryCurrency: string; requiredNetwork: string }
> = {
  BTC: { libraryCurrency: "BTC", requiredNetwork: "BTC" },
  LTC: { libraryCurrency: "LTC", requiredNetwork: "LTC" },
  DASH: { libraryCurrency: "DASH", requiredNetwork: "DASH" },
  BCH: { libraryCurrency: "BCH", requiredNetwork: "BCH" },
  ETH: { libraryCurrency: "ETH", requiredNetwork: "ETH" },
  USDT: { libraryCurrency: "TRX", requiredNetwork: "TRC20" },
  USDC: { libraryCurrency: "TRX", requiredNetwork: "TRC20" },
};

const validatorNetwork = (environment: string): ValidatorNetwork =>
  environment.toLowerCase() === "testnet" ? "testnet" : "prod";

export const addressValid = (
  value: unknown,
  crypto: unknown,
  network?: unknown,
  environment = import.meta.env.VITE_ENV_NETWORK,
): boolean | string => {
  const rawAddress = typeof value === "string" ? value : "";
  const rawCurrency = typeof crypto === "string" ? crypto : "";
  const rawNetwork = typeof network === "string" ? network : "";

  const currency = rawCurrency.trim().toUpperCase() as SupportedCurrency;
  const target = VALIDATOR_TARGETS[currency];
  const normalizedAddress = rawAddress.trim();
  const normalizedNetwork = (rawNetwork || target?.requiredNetwork || "")
    .trim()
    .toUpperCase();

  if (
    !target ||
    !normalizedAddress ||
    normalizedAddress !== rawAddress ||
    normalizedNetwork !== target.requiredNetwork
  ) {
    return "Dirección inválida, por favor verificar";
  }

  try {
    const valid = WAValidator.validate(
      normalizedAddress,
      target.libraryCurrency,
      validatorNetwork(environment),
    );
    if (valid) return true;
  } catch {
    // Validation failures are presented uniformly; the backend validates again.
  }

  return "Dirección inválida, por favor verificar";
};

export const required = (value: any): boolean | string =>
  value ? true : "Requerido";

export const password = (pass: string): boolean | string => {
  const validate =
    /^(?=.*[a-záéíóúüñ])(?=.*\d)(?=.*[A-ZÁÉÍÓÚÜÑ])(?=.*[-_@$!%*?&€£.,¡¿])[A-Za-záéíóúüñÁÉÍÓÚÜÑ\d\-_@$!%*?&#€£.,¡¿]{8,}$/;
  if (validate.test(pass)) {
    return true;
  }
  return "No cumple con lo establecido";
};

export const confirmPassword = (
  value: string,
  confirm: string
): boolean | string => value === confirm || "Las contraseñas no coinciden";

export const email = (email: string): boolean | string => {
  const validate = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (validate.test(email)) {
    return true;
  }
  return "Debe ser un correo válido";
};

export const onlyLetters = (email: string): boolean | string => {
  const validate = /^[A-ZÁÉÍÓÚÑ ]+$/i;
  if (validate.test(email)) {
    return true;
  }
  return "Solo letras";
};

export const onlyNumbers = (number: string): boolean | string => {
  const validate = /^[0-9 ]+$/i;
  if (validate.test(number)) {
    return true;
  }
  return "Solo números";
};

export const amountFormat = (event: any, length = 3): string => {
  if (length === 1) {
    const val: string = event.target.value;
    event.target.value = val + ",";
  }
  const text = event.target.value;
  let reem = text.toString().toString().replace(/\D/g, ""); // quitando todo lo que no sea números
  if (reem.length < length && event.key == "Backspace") {
    // Si la cantidad restante de dígitos es menor a el valor y además se está borrando
    // if (reem.length == length-1) {
    // Si la cantidad de dígitos es igual a un numero inferior que el total de digitos
    reem = "0" + reem; // agrego un cero al principio
    // }
  } else if (reem.substring(0, 1) == "0") {
    // Si el primero número es un cero
    const subNum = reem.substring(1, reem.length); // obtengo el resto de números
    reem = subNum; // es decir, los "decimales"

    if (subNum.length > length + 1 && subNum.substring(0, 2) == "00") {
      // Si los recimales es mayor que mi número total  y los dos primeros son ceros
      const subNumber = subNum.substring(2, subNum.length); // quito los dos primeros ceros
      reem = subNumber; // igualo
    }
  }
  // 9        - (8 -1)
  let partInteger = reem.substring(0, reem.length - (length - 1)); // parte entera
  if (partInteger.length == 2 && partInteger == "00") {
    partInteger = "0";
  }
  const partDecimal = reem.substring(reem.length - (length - 1), reem.length); // parte decimal
  const coma: string = partInteger + "," + partDecimal;

  // agrupar de a grupos de a 3 antes de la coma y añadie un .
  event.target.value = coma.toString().replace(/\d(?=(\d{3})+\,)/g, "$&.");


  if (event.target.value != null) {
    for (const char of event.target.value) {
      if (event.target.value.indexOf(",,") != -1) {
        event.target.value = event.target.value.split(",,").join(",");
      }
    }
  }


  if (event.target.value.length < length + 1) {
    const lengthCurrent = event.target.value.length;
    const lengthTotal = length + 1;
    event.target.value =
      "0," +
      "0".repeat(lengthTotal - lengthCurrent) +
      event.target.value.replace(",", "");
  }

  if (length === 1) {
    const val: string = event.target.value;
    event.target.value = val.slice(0, val.length - 1);
  }
  return event.target.value;
};

export const transformAmount = (amount: string): number => {
  let newstring = amount.split(".").join("");
  newstring = newstring.replace(",", ".");
  return parseFloat(newstring);
};

export const keyPressIsNumber = (event: any) => {
  return event.charCode >= 48 && event.charCode <= 57;
};

export const keyPressOnlyNumberAndBackscape = (event: any) => {
  if (!keyPressIsNumber(event) && event.key != "Backscape") {
    event.preventDefault();
  }
};
export const keyPressOnlyLettersAndSpace = (event: KeyboardEvent) => {
  const regex = /^[A-Za-z\sñÑ]$/;
  if (!regex.test(event.key)) {
    event.preventDefault();
  }
};
