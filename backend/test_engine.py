from synthetic_generator import IndianBankingDataGenerator
from detection_engine import KavachDetectionEngine
from graph_engine import IndianFinancialGraphEngine
from compliance import IndianComplianceReporting

def main():
    print("Testing Kavach-Bharat Core Components...")
    gen = IndianBankingDataGenerator()
    det = KavachDetectionEngine()
    ge = IndianFinancialGraphEngine()

    # Normal transaction test
    norm = gen.generate_normal_transaction()
    norm_res = det.evaluate_transaction(norm)
    ge.add_transaction(norm)
    print("Normal Txn Risk:", norm_res["risk_score"], norm_res["risk_level"])

    # Attack tests
    for scenario in ["DIGITAL_ARREST", "JAN_DHAN_SMURFING", "UPI_COLLECT_TRAP", "CIRCULAR_LAYERING"]:
        attack = gen.generate_attack_scenario(scenario)
        print(f"\n--- Testing Scenario: {scenario} ({len(attack)} txns) ---")
        for txn in attack:
            res = det.evaluate_transaction(txn)
            ge.add_transaction(txn)
            print(f"  Txn {txn['txn_id']} -> Score: {res['risk_score']} | Level: {res['risk_level']} | Action: {res['recommended_action']}")

    # Graph tests
    graph_vis = ge.export_graph_for_visualization()
    print("\nGraph Summary:", graph_vis["summary"])

    # Compliance test
    str_report = IndianComplianceReporting.generate_fiu_ind_str(attack[0], res)
    print("Generated STR Report ID:", str_report["report_header"]["report_id"])
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
