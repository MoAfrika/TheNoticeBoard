"""Placeholder scrapers for sources not yet built. Registered so the UI can show them transparently.

Each placeholder appears on the /sources page as "Coming soon" so users know
exactly which official channels we plan to aggregate — nothing is faked."""
from . import BaseScraper, register


class DPSA(BaseScraper):
    key = "dpsa"
    name = "DPSA Public Service Vacancy Circular"
    description = "Weekly national + provincial government vacancies (PDF circular). Requires PDF parser — coming soon."
    homepage = "https://www.dpsa.gov.za/newsroom/psvc/"
    category = "government"
    live = False
    async def fetch(self): return []


class CityOfCapeTown(BaseScraper):
    key = "cot"
    name = "City of Cape Town Careers"
    description = "Municipal vacancies from the City of Cape Town official portal. Coming soon."
    homepage = "https://www.capetown.gov.za/Family%20and%20home/Education-and-research-materials/Jobs"
    category = "government"
    live = False
    async def fetch(self): return []


class CityOfJoburg(BaseScraper):
    key = "coj"
    name = "City of Johannesburg Careers"
    description = "Municipal vacancies from the City of Johannesburg. Coming soon."
    homepage = "https://www.joburg.org.za"
    category = "government"
    live = False
    async def fetch(self): return []


class Ethekwini(BaseScraper):
    key = "ethekwini"
    name = "eThekwini Municipality Careers"
    description = "Municipal vacancies from eThekwini (Durban). Coming soon."
    homepage = "http://www.durban.gov.za"
    category = "government"
    live = False
    async def fetch(self): return []


class MiningHouses(BaseScraper):
    key = "mining"
    name = "Mining Sector (Anglo, Sibanye, Impala, Harmony, Gold Fields)"
    description = "Aggregated official careers portals of major SA mining houses. Coming soon — each uses a different ATS platform."
    homepage = ""
    category = "job"
    live = False
    async def fetch(self): return []


class PrivateSectorAggregator(BaseScraper):
    key = "private-aggregator"
    name = "Private Sector Verified Employers"
    description = "Verified private sector opportunities pulled directly from employers' official careers pages. Coming soon."
    homepage = ""
    category = "job"
    live = False
    async def fetch(self): return []


# Youth / Skills programmes
class SAYouth(BaseScraper):
    key = "sayouth"
    name = "SAYouth.mobi (Presidential Youth Employment Intervention)"
    description = "Official youth learnership, internship and entry-level opportunities from SAYouth.mobi. Coming soon."
    homepage = "https://sayouth.mobi/"
    category = "learnership"
    live = False
    async def fetch(self): return []


class Learnerships(BaseScraper):
    key = "learnerships"
    name = "SETA-Accredited Learnerships"
    description = "SETA-accredited learnership programmes across all 21 SETAs (Services, MICT, MerSETA, W&RSETA, and more). Coming soon."
    homepage = "https://www.gov.za/services/services-organisations/setas"
    category = "learnership"
    live = False
    async def fetch(self): return []


class InternshipsGov(BaseScraper):
    key = "internships-gov"
    name = "Government Internship Programmes"
    description = "Official graduate internship & YES 4 Youth programmes across national departments and SOEs. Coming soon."
    homepage = "https://www.yes4youth.co.za/"
    category = "internship"
    live = False
    async def fetch(self): return []


# Bursaries
class NSFAS(BaseScraper):
    key = "nsfas"
    name = "NSFAS Bursary Programme"
    description = "National Student Financial Aid Scheme — university & TVET bursary intake. Coming soon."
    homepage = "https://www.nsfas.org.za/"
    category = "bursary"
    live = False
    async def fetch(self): return []


class SAICABursaries(BaseScraper):
    key = "saica"
    name = "SAICA CA(SA) Bursary Programme"
    description = "Chartered Accountancy full-cost bursary and Thuthuka programme. Coming soon."
    homepage = "https://www.saica.co.za/"
    category = "bursary"
    live = False
    async def fetch(self): return []


class CorporateBursaries(BaseScraper):
    key = "corporate-bursaries"
    name = "Corporate Bursary Programmes"
    description = "Aggregated bursaries from SA's largest funders (Sasol, Investec, Standard Bank, Discovery, Old Mutual, Sanlam, MTN, Vodacom, PwC, Deloitte). Coming soon."
    homepage = ""
    category = "bursary"
    live = False
    async def fetch(self): return []


class GraduateProgrammes(BaseScraper):
    key = "graduate-programmes"
    name = "Corporate Graduate Programmes"
    description = "Verified graduate programmes from Big 4 (PwC, Deloitte, EY, KPMG), Big 4 banks, Big 3 telcos, and major FMCG. Coming soon."
    homepage = ""
    category = "internship"
    live = False
    async def fetch(self): return []


class Pnet(BaseScraper):
    key = "pnet"
    name = "Pnet Verified Jobs"
    description = "Verified employers on Pnet.co.za. Requires employer verification pipeline (only post if the employer can be independently verified). Coming soon."
    homepage = "https://www.pnet.co.za/"
    category = "job"
    live = False
    async def fetch(self): return []


for cls in [
    DPSA, CityOfCapeTown, CityOfJoburg, Ethekwini, MiningHouses, PrivateSectorAggregator,
    SAYouth, Learnerships, InternshipsGov,
    NSFAS, SAICABursaries, CorporateBursaries, GraduateProgrammes,
    Pnet,
]:
    register(cls())
