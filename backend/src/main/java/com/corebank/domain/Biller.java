package com.corebank.domain;

public enum Biller {
    BESCOM("Electricity", "BESCOM"),
    BWSSB("Water", "BWSSB"),
    INDIANE("LPG", "Indane Gas"),
    TATAPLAY("DTH", "Tata Play"),
    AIRTEL_BB("Broadband", "Airtel Fiber");

    private final String category;
    private final String displayName;

    Biller(String category, String displayName) {
        this.category = category;
        this.displayName = displayName;
    }

    public String getCategory() {
        return category;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static Biller fromCode(String code) {
        if (code == null) {
            return null;
        }
        try {
            return Biller.valueOf(code.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
