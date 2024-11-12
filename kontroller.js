function sayiDisindaKarakterVarMi(str) {
    return /\D/.test(str);
}

function harfDisindaKarakterVarMi(str) {
    return /[^a-zA-ZçÇğĞıİöÖşŞüÜ]/.test(str);
}

function isValidDate(str) {
    // Tarih formatı: YYYY-MM-DD
    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    // Regex doğrulama
    if (!dateRegex.test(str)) {
        return false;
    }

    // Geçerli bir tarih olup olmadığını kontrol etmek için `Date` nesnesi oluşturuyoruz
    const date = new Date(str);
    return date.getFullYear() === parseInt(str.substring(0, 4), 10) &&
           date.getMonth() + 1 === parseInt(str.substring(5, 7), 10) &&
           date.getDate() === parseInt(str.substring(8, 10), 10);
}

function isValidTime(str)
{
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    return timeRegex.test(str);
}

function emailGecerliMi(email) {
    // E-posta adresinde izin verilen karakterleri kontrol eden düzenli ifade
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

function sifreGecerliMi(sifre) {
    const sifreRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return sifreRegex.test(sifre);
}

module.exports = { sayiDisindaKarakterVarMi, harfDisindaKarakterVarMi, isValidDate, isValidTime, emailGecerliMi, sifreGecerliMi };