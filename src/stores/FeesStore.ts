import { defineStore, storeToRefs } from "pinia";
import { reactive } from "vue";
import { helperStore } from "@/helper";
import { WalletStore } from "./WalletStore";

export const FeesStore = defineStore("fees", () => {
  const walletStore = WalletStore();
  const { currencyTicker } = storeToRefs(walletStore);
  const helper = helperStore();

  const dataMempoolFees = reactive<DataMempool>({
    economyFee: 0,
    fastestFee: 0,
    halfHourFee: 0,
    hourFee: 0,
    minimumFee: 0,
  });

  const getFeesPrice = async () => {
    try {
      const url = "/currency/fees/recomend";
      const headers = {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      };
      //   const res = await fetch(url, {
      //     method: 'get',
      //     headers
      //   })
      //   const res = await (await axios.get(url,{headers})).data as DataMempool
      const res = (await helper.http(url, "get", { headers }))
        .data as DataMempool;
      dataMempoolFees.economyFee = res.economyFee;
      dataMempoolFees.fastestFee = res.fastestFee;
      dataMempoolFees.halfHourFee = res.halfHourFee;
      dataMempoolFees.hourFee = res.hourFee;
      dataMempoolFees.minimumFee = res.minimumFee;
    } catch {
      helper.showNotify("Ha ocurrido un error, por favor intente mas tarde", {
        type: "error",
      });
      // setTimeout(() => {window.location.reload()},5000)
    }
  };

  const labelToFees: LabelToFees = {
    sendNormal: "minimumFee",
    groupTransaction: "economyFee",
    payFee: "halfHourFee",
    feesPriority: "fastestFee",
  };

  const checkboxes = reactive<Checkboxes[]>([
    {
      label: "groupTransaction",
      text: `<span class="text-primary font-weight-bold">Agrupar</span> mi transaccion con otras de esta manera se paga una
                comision mas alta por todas y esto hace que se confirme mas
                rapido el tiempo de espera es de (1-3 horas).`,
      fees: "0",
      feesBtc: "",
    },
    {
      label: "payFee",
      text: ` <span class="text-primary font-weight-bold">Pagar</span> una comision normal de {btc} BTC equivalentes a -
                ({usd} USD) con esta opcion es mas probable tener una
                confirmacion mas rapido.`,
      fees: "0",
      feesBtc: "",
    },
    {
      label: "sendNormal",
      text: ` <span class="text-primary font-weight-bold">Enviar</span> mi transaccion inmediatamente con la comision que xeler
                puede asumir entiendo que no hay tiempo estimado de confirmacion
                pueden ser varias horas.`,
      fees: "0",
      feesBtc: "",
    },
    {
      label: "feesPriority",
      text: ` <span class="text-primary font-weight-bold">Pagar</span> una comision de envio prioritario de {btc} BTC
                equivalentes a ({usd} USD) esta opcion el envio se envia con la
                comision mas alta posible para ser confirmado en diez minutos o
                maximo 20.`,
      fees: "0",
      feesBtc: "",
    },
  ]);

  const convertInBtc = (satoshi: number): number => satoshi / 100000000;
  const convertBtcInBytes = (btc: number): number => btc * 256;

  const setCheckbox = async () => {
    await getFeesPrice();
    const btc = currencyTicker.value.find((c) => c.symbol === "BTC");
    const priceBtcInUsd = Number(btc?.oficial_usd?.replace(".", "") ?? 0);
    if (!Number.isFinite(priceBtcInUsd) || priceBtcInUsd <= 0) {
      helper.showNotify("No hay tasa BTC disponible.", { type: "error" });
      return;
    }
    for (const label in labelToFees) {
      const feeName = labelToFees[
        label as keyof LabelToFees
      ] as keyof DataMempool;
      const feeValue = dataMempoolFees[feeName] ?? 0;
      const feesInBtc = convertInBtc(feeValue);
      const feesInBytes = convertBtcInBytes(feesInBtc);
      const newFeePriceUsd = feesInBytes * priceBtcInUsd;
      const oldCheck = checkboxes.find((check) => check.label === label)!;
      const newCheck: Checkboxes = {
        fees: newFeePriceUsd.toFixed(2),
        feesBtc: feesInBytes.toFixed(8),
        label: oldCheck.label,
        text: oldCheck.text
          .replace("{usd}", newFeePriceUsd.toFixed(2))
          .replace("{btc}", feesInBytes.toFixed(8)),
      };
      checkboxes.find((check) => check.label === label)!;
      checkboxes.find((check) => check.label === label)!.fees = newCheck.fees;
      checkboxes.find((check) => check.label === label)!.feesBtc =
        newCheck.feesBtc;
      checkboxes.find((check) => check.label === label)!.text = newCheck.text;
    }
  };

  const convertBtcInPesos = (btcV: number | string): number => {
    let value = btcV;
    if (typeof value === "string") {
      value = parseFloat(value);
    }

    const btc = currencyTicker.value.find((c) => c.symbol === "BTC");
    return value * Number(btc?.oficial ?? 0);
  };

  return {
    checkboxes,
    getFeesPrice,
    setCheckbox,
    convertBtcInPesos,
  };
});
// ++++++++++++++++++++++++++++++++++++++++++++
interface LabelToFees {
  sendNormal: keyof DataMempool;
  groupTransaction: keyof DataMempool;
  payFee: keyof DataMempool;
  feesPriority: keyof DataMempool;
}
interface Checkboxes {
  label: keyof Comisiones;
  text: string;
  fees: string;
  feesBtc: string;
}

interface Comisiones {
  groupTransaction: boolean;
  payFee: boolean;
  sendNormal: boolean;
  feesPriority: boolean;
}

interface DataMempool {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}
