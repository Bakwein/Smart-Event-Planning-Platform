function sayiDisindaKarakterVarMi(str) {
    return /\D/.test(str);
}

function harfDisindaKarakterVarMi(str) {
    return /[^a-zA-ZçÇğĞıİöÖşŞüÜ]/.test(str);
}

function isValidDate(str)
{
    const date = new Date(str);
    return !isNaN(date.getTime());
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



module.exports = { sayiDisindaKarakterVarMi, harfDisindaKarakterVarMi, isValidDate, emailGecerliMi, sifreGecerliMi };