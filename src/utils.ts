export function formatAccessCode(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, "$1  ").trim();
}
export function greeting(name: string, hour: number): string {
  if (hour >= 5 && hour < 12) return `Bom dia, ${name}. Pronto para descobrir mais sobre o mundo automotivo?`;
  if (hour >= 12 && hour < 18) return `Boa tarde, ${name}. Sua próxima etapa está esperando por você.`;
  if (hour >= 18) return `Boa noite, ${name}. Que tal aprender algo novo sobre motores hoje?`;
  return `Boa madrugada, ${name}. Parece que a paixão por carros não tem horário.`;
}
export function greetingTitle(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  if (hour >= 18) return "Boa noite";
  return "Boa madrugada";
}
export function theoreticalSpeed(rpm: number, gearRatio: number, finalDrive: number, tireDiameterM: number): number {
  if (![rpm, gearRatio, finalDrive, tireDiameterM].every(Number.isFinite) || rpm < 0 || gearRatio <= 0 || finalDrive <= 0 || tireDiameterM <= 0) return 0;
  return rpm / (gearRatio * finalDrive) * Math.PI * tireDiameterM * 60 / 1000;
}
export function speak(text: string): boolean {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const message = new SpeechSynthesisUtterance(text);
  message.lang = "pt-BR";
  message.rate = 0.96;
  message.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((item) => item.lang.toLowerCase() === "pt-br" && /natural|premium|google|microsoft/i.test(item.name))
    || voices.find((item) => item.lang.toLowerCase() === "pt-br");
  if (voice) message.voice = voice;
  window.speechSynthesis.speak(message);
  return true;
}
