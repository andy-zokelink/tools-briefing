#!/usr/bin/env perl
use strict;
use warnings;

# Flip dark → white theme for all report HTML files passed as arguments
# Usage: perl _flip-reports.pl reports/*.html

for my $file (@ARGV) {
    open my $fh, '<:encoding(UTF-8)', $file or die "Cannot open $file: $!";
    my $html = do { local $/; <$fh> };
    close $fh;

    my $orig = $html;

    # ═══════════════════════════════════════════
    # HEX COLOR REPLACEMENTS
    # ═══════════════════════════════════════════

    # Background layers
    $html =~ s/#08090a/#f8f9fb/g;
    $html =~ s/#0f1011/#eef0f3/g;
    $html =~ s/#191a1b/#ffffff/g;
    $html =~ s/#222326/#f4f5f8/g;

    # Text
    $html =~ s/#f7f8f8/#1a1d23/g;
    $html =~ s/#d0d6e0/#5a6570/g;
    $html =~ s/#8a8f98/#8a9099/g;
    $html =~ s/#62666d/#8a9099/g;

    # Accents
    $html =~ s/#5e6ad2/#4f46e5/g;
    $html =~ s/#7170ff/#6366f1/g;
    $html =~ s/#27a644/#16a34a/g;
    $html =~ s/#d2991d/#d97706/g;
    $html =~ s/#f85149/#dc2626/g;
    $html =~ s/#39c5cf/#0891b2/g;
    $html =~ s/#05070a/#f8f9fb/g;

    # ═══════════════════════════════════════════
    # RGBA REPLACEMENTS — nav/UI backgrounds
    # ═══════════════════════════════════════════

    # Hardcoded nav/banner dark backgrounds → light glass
    $html =~ s/rgba\(15,16,17,\.92\)/rgba(248,249,251,0.92)/g;
    $html =~ s/rgba\(15,16,17,0\.92\)/rgba(248,249,251,0.92)/g;
    $html =~ s/rgba\(15,16,17,0\.94\)/rgba(248,249,251,0.94)/g;
    $html =~ s/rgba\(10,14,20,0\.85\)/rgba(248,249,251,0.92)/g;

    # White borders → dark borders
    $html =~ s/rgba\(255,255,255,\.15\)/rgba(0,0,0,0.12)/g;
    $html =~ s/rgba\(255,255,255,0\.05\)/rgba(0,0,0,0.04)/g;
    $html =~ s/rgba\(255,255,255,0\.06\)/rgba(0,0,0,0.05)/g;
    $html =~ s/rgba\(255,255,255,0\.08\)/rgba(0,0,0,0.07)/g;
    $html =~ s/rgba\(255,255,255,0\.14\)/rgba(0,0,0,0.10)/g;
    $html =~ s/rgba\(255,255,255,0\.15\)/rgba(0,0,0,0.12)/g;

    # Accent rgba (94,106,210 → 79,70,229)
    $html =~ s/rgba\(94,106,210,\.05\)/rgba(79,70,229,0.05)/g;
    $html =~ s/rgba\(94,106,210,\.06\)/rgba(79,70,229,0.06)/g;
    $html =~ s/rgba\(94,106,210,0\.06\)/rgba(79,70,229,0.06)/g;
    $html =~ s/rgba\(94,106,210,\.1\)/rgba(79,70,229,0.10)/g;
    $html =~ s/rgba\(94,106,210,0\.1\)/rgba(79,70,229,0.10)/g;
    $html =~ s/rgba\(94,106,210,\.12\)/rgba(79,70,229,0.10)/g;
    $html =~ s/rgba\(94,106,210,0\.12\)/rgba(79,70,229,0.10)/g;
    $html =~ s/rgba\(94,106,210,\.18\)/rgba(79,70,229,0.15)/g;
    $html =~ s/rgba\(94,106,210,0\.18\)/rgba(79,70,229,0.15)/g;
    $html =~ s/rgba\(94,106,210,\.2\)/rgba(79,70,229,0.15)/g;
    $html =~ s/rgba\(94,106,210,0\.2\)/rgba(79,70,229,0.15)/g;
    $html =~ s/rgba\(94,106,210,\.25\)/rgba(79,70,229,0.20)/g;
    $html =~ s/rgba\(94,106,210,0\.25\)/rgba(79,70,229,0.20)/g;
    $html =~ s/rgba\(94,106,210,\.3\)/rgba(79,70,229,0.25)/g;
    $html =~ s/rgba\(94,106,210,0\.3\)/rgba(79,70,229,0.25)/g;

    # Accent-bright rgba (113,112,255 → 99,102,241)
    $html =~ s/rgba\(113,112,255,\.06\)/rgba(99,102,241,0.06)/g;
    $html =~ s/rgba\(113,112,255,0\.07\)/rgba(99,102,241,0.06)/g;
    $html =~ s/rgba\(113,112,255,0\.1\)/rgba(99,102,241,0.10)/g;
    $html =~ s/rgba\(113,112,255,0\.12\)/rgba(99,102,241,0.10)/g;
    $html =~ s/rgba\(113,112,255,0\.5\)/rgba(99,102,241,0.40)/g;
    $html =~ s/rgba\(113,112,255,0\.7\)/rgba(99,102,241,0.40)/g;

    # Text3 rgba (138,143,152 → 138,144,153)
    $html =~ s/rgba\(138,143,152,0\.1\)/rgba(138,144,153,0.10)/g;
    $html =~ s/rgba\(138,143,152,0\.12\)/rgba(138,144,153,0.12)/g;
    $html =~ s/rgba\(138,143,152,0\.5\)/rgba(138,144,153,0.40)/g;
    $html =~ s/rgba\(138,143,152,0\.7\)/rgba(138,144,153,0.40)/g;

    # Green rgba (39,166,68 → 22,163,74)
    $html =~ s/rgba\(39,166,68,\.12\)/rgba(22,163,74,0.12)/g;
    $html =~ s/rgba\(39,166,68,0\.1\)/rgba(22,163,74,0.10)/g;
    $html =~ s/rgba\(39,166,68,0\.12\)/rgba(22,163,74,0.12)/g;
    $html =~ s/rgba\(39,166,68,\.2\)/rgba(22,163,74,0.20)/g;
    $html =~ s/rgba\(39,166,68,0\.2\)/rgba(22,163,74,0.20)/g;
    $html =~ s/rgba\(39,166,68,0\.5\)/rgba(22,163,74,0.40)/g;
    $html =~ s/rgba\(39,166,68,0\.7\)/rgba(22,163,74,0.40)/g;

    # Orange rgba (210,153,29 → 217,119,6)
    $html =~ s/rgba\(210,153,29,\.12\)/rgba(217,119,6,0.12)/g;
    $html =~ s/rgba\(210,153,29,0\.1\)/rgba(217,119,6,0.10)/g;
    $html =~ s/rgba\(210,153,29,0\.12\)/rgba(217,119,6,0.12)/g;
    $html =~ s/rgba\(210,153,29,\.2\)/rgba(217,119,6,0.20)/g;
    $html =~ s/rgba\(210,153,29,0\.2\)/rgba(217,119,6,0.20)/g;
    $html =~ s/rgba\(210,153,29,0\.4\)/rgba(217,119,6,0.30)/g;
    $html =~ s/rgba\(210,153,29,0\.5\)/rgba(217,119,6,0.40)/g;
    $html =~ s/rgba\(210,153,29,0\.7\)/rgba(217,119,6,0.40)/g;

    # Red rgba (248,81,73 → 220,38,38)
    $html =~ s/rgba\(248,81,73,0\.1\)/rgba(220,38,38,0.10)/g;
    $html =~ s/rgba\(248,81,73,0\.18\)/rgba(220,38,38,0.15)/g;
    $html =~ s/rgba\(248,81,73,0\.5\)/rgba(220,38,38,0.40)/g;
    $html =~ s/rgba\(248,81,73,0\.7\)/rgba(220,38,38,0.40)/g;

    # Cyan rgba (57,197,207 → 8,145,178)
    $html =~ s/rgba\(57,197,207,0\.1\)/rgba(8,145,178,0.10)/g;
    $html =~ s/rgba\(57,197,207,0\.12\)/rgba(8,145,178,0.12)/g;
    $html =~ s/rgba\(57,197,207,0\.2\)/rgba(8,145,178,0.20)/g;
    $html =~ s/rgba\(57,197,207,0\.5\)/rgba(8,145,178,0.40)/g;
    $html =~ s/rgba\(57,197,207,0\.7\)/rgba(8,145,178,0.40)/g;

    # Only write if changed
    if ($html ne $orig) {
        open my $out, '>:encoding(UTF-8)', "$file.tmp" or die "Cannot write $file.tmp: $!";
        print $out $html;
        close $out;
        rename "$file.tmp", $file or die "Cannot rename $file.tmp → $file: $!";
        print "✓ $file\n";
    } else {
        print "· $file (unchanged)\n";
    }
}

print "\nDone.\n";
