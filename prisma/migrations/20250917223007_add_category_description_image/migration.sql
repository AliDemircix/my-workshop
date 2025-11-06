-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "privacyLabel" TEXT DEFAULT 'Privacy Policy',
    "privacyUrl" TEXT DEFAULT '/privacy-policy',
    "contactLabel" TEXT DEFAULT 'Contact',
    "contactUrl" TEXT DEFAULT '/contact',
    "refundLabel" TEXT DEFAULT 'Refund Policy',
    "refundUrl" TEXT DEFAULT '/refund',
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "address" TEXT,
    "kvk" TEXT,
    "iban" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
