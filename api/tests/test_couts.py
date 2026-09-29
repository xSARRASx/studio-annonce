import unittest
from decimal import Decimal
from app.couts import montant_usd

class Couts(unittest.TestCase):
    def test_image_compte_source_prompt_et_sortie(self):
        self.assertEqual(montant_usd("gpt-image-2.5-sunburst",{"input_tokens_details":{"image_tokens":1500,"text_tokens":300},"output_tokens":2000}),Decimal("0.0735"))
    def test_texte_distingue_entree_cachee(self):
        self.assertEqual(montant_usd("gpt-5.4-mini",{"input_tokens":2000,"input_tokens_details":{"cached_tokens":1000},"output_tokens":500}),Decimal("0.003075"))
    def test_usage_absent_ou_modele_inconnu_ne_coute_pas_zero(self):
        self.assertIsNone(montant_usd("gpt-image-2.5-sunburst",{}))
        self.assertIsNone(montant_usd("modele-inconnu",{"input_tokens":100,"output_tokens":100}))
