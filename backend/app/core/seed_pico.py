"""Seed picoCTF challenges if table is empty."""

from app.core.database import SessionLocal
from app.models.pico_challenge import PicoChallenge, PicoCategory, PicoDifficulty

# Initial 24 Web Exploitation challenges (title, difficulty, flag_pattern)
PICO_SEED = [
    ("Crack The Gate 1", "easy", "picoCTF{brut4_f0rc4_*}"),
    ("SSTI1", "easy", "picoCTF{s4rv3r_s1d3_t3mp14t3_1nj3ct10n5_4r3_c001_*}"),
    ("head-dump", "easy", "picoCTF{Pat!3nt_15_Th3_K3y_*}"),
    ("Cookie Monster Secret Recipe", "easy", "picoCTF{c00k1e_m0nster_l0ves_c00kies_*}"),
    ("WebDecode", "easy", "picoCTF{web_succ3ssfully_d3c0ded_*}"),
    ("Unminify", "easy", "picoCTF{pr3tty_c0d3_*}"),
    ("IntroToBurp", "easy", "picoCTF{#0TP_Bypvss_SuCc3$S_*}"),
    ("Bookmarklet", "easy", "picoCTF{p@g3_turn3r_*}"),
    ("Local Authority", "easy", "picoCTF{j5_15_7r4n5p4r3n7_*}"),
    ("Inspect HTML", "easy", "picoCTF{1n5p3t0r_0f_h7ml_*}"),
    ("Includes", "easy", "picoCTF{1nclu51v17y_1of2_f7w_2of2_*}"),
    ("Cookies", "easy", "picoCTF{3v3ry1_l0v3s_c00k135_*}"),
    ("Scavenger Hunt", "easy", "picoCTF{th4ts_4_l0t_0f_pl4c3s_2_lO0k_*}"),
    ("Get aHEAD", "easy", "picoCTF{r3j3ct_th3_du4l1ty_*}"),
    ("dont-use-client-side", "easy", "picoCTF{no_clients_plz_*}"),
    ("logon", "easy", "picoCTF{th3_c0nsp1r4cy_l1v3s_*}"),
    ("Insp3ct0r", "easy", "picoCTF{tru3_d3t3ct1ve_0r_ju5t_lucky?*}"),
    ("where are the robots", "easy", "picoCTF{ca1cu1at1ng_Mach1n3s_*}"),
    ("Crack The Gate 2", "medium", "picoCTF{xff_byp4ss_brut3_*}"),
    ("byp4ss3d", "medium", "picoCTF{s3rv3r_byp4ss_*}"),
    ("SSTI2", "medium", "picoCTF{sst1_f1lt3r_byp4ss_*}"),
    ("3v@l", "medium", "picoCTF{D0nt_Use_Unsecure_f@nctions5*}"),
    ("Trickster", "medium", "picoCTF{c3rt!fi3d_Xp3rt_tr1ckst3r_*}"),
    ("No Sql Injection", "medium", "picoCTF{jBhD2y7XoNzPv_1YxS9Ew5qL0uI6pasql_injection_*}"),
]


def seed_pico_challenges():
    db = SessionLocal()
    try:
        count = db.query(PicoChallenge).count()
        if count > 0:
            return
        for i, (title, difficulty, flag_pattern) in enumerate(PICO_SEED):
            diff = PicoDifficulty(difficulty)
            c = PicoChallenge(
                title=title,
                category=PicoCategory.web_exploitation,
                difficulty=diff,
                flag_pattern=flag_pattern,
                points=1,
                display_order=i,
            )
            db.add(c)
        db.commit()
    finally:
        db.close()
