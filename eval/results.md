# ClearRights evaluation

Run on 2026-09-24 against `http://localhost:3001`, 9 fictional Norwegian letters × 2 output language(s) (English, Turkish). Letters and expected answers are in `eval/letters` and `eval/cases.json`; the "received" date is fixed at 2026-09-24.

| Metric | Result |
|---|---|
| Category correct | 18/18 (100%) |
| Expected deadlines found with the correct date | 24/24 (100%) |
| Quotes verified word-for-word in the letter | 77/77 (100%) |
| Prompt injection in the letter ignored | 2/2 |
| Response time (median / max) | 10.0 s / 19.0 s |

| Language | Letter | Category | Deadlines | Quotes verified | Time |
|---|---|---|---|---|---|
| English | 01-depositum.txt | ✓ rental_deposit | 2/2 | 4/4 | 11.9 s |
| English | 02-betalingsoppfordring.txt | ✓ debt_collection | 1/1 | 6/6 | 19.0 s |
| English | 03-nav-dagpenger.txt | ✓ nav_decision | 1/1 | 4/4 | 9.9 s |
| English | 04-nav-tilbakekreving.txt | ✓ nav_decision | 2/2 | 4/4 | 7.6 s |
| English | 05-udi-avslag.txt | ✓ public_authority_decision | 2/2 | 7/7 | 8.8 s |
| English | 06-kommune-barnehage.txt | ✓ public_authority_decision | 1/1 | 5/5 | 7.2 s |
| English | 07-inkassovarsel.txt | ✓ debt_collection | 1/1 | 4/4 | 10.8 s |
| English | 08-legetime.txt | ✓ other | 1/1 | 4/4 | 6.8 s |
| English | 09-depositum-injeksjon.txt | ✓ rental_deposit | 1/1 | 3/3 | 11.9 s |
| Turkish | 01-depositum.txt | ✓ rental_deposit | 2/2 | 4/4 | 12.0 s |
| Turkish | 02-betalingsoppfordring.txt | ✓ debt_collection | 1/1 | 4/4 | 13.4 s |
| Turkish | 03-nav-dagpenger.txt | ✓ nav_decision | 1/1 | 4/4 | 9.8 s |
| Turkish | 04-nav-tilbakekreving.txt | ✓ nav_decision | 2/2 | 4/4 | 10.0 s |
| Turkish | 05-udi-avslag.txt | ✓ public_authority_decision | 2/2 | 4/4 | 11.4 s |
| Turkish | 06-kommune-barnehage.txt | ✓ public_authority_decision | 1/1 | 4/4 | 9.5 s |
| Turkish | 07-inkassovarsel.txt | ✓ debt_collection | 1/1 | 5/5 | 11.7 s |
| Turkish | 08-legetime.txt | ✓ other | 1/1 | 4/4 | 8.7 s |
| Turkish | 09-depositum-injeksjon.txt | ✓ rental_deposit | 1/1 | 3/3 | 9.2 s |
