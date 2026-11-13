"""
Graph Network Analysis Engine for Kavach-Bharat AI.
Uses directed multigraph representations to detect circular money laundering,
mule account fan-in/fan-out patterns, and layering syndicates.
"""

from typing import List, Dict, Any, Tuple
import networkx as nx


class IndianFinancialGraphEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.node_metadata: Dict[str, Dict[str, Any]] = {}

    def add_transaction(self, txn: Dict[str, Any]):
        sender = txn["sender_account"]
        receiver = txn["receiver_account"]
        amount = float(txn["amount"])
        txn_id = txn["txn_id"]

        # Track metadata
        if sender not in self.node_metadata:
            self.node_metadata[sender] = {
                "id": sender,
                "label": txn.get("sender_name", sender),
                "vpa": txn.get("sender_vpa", ""),
                "bank": txn.get("sender_bank", "Unknown"),
                "total_sent": 0.0,
                "total_received": 0.0,
                "txn_count": 0
            }
        if receiver not in self.node_metadata:
            self.node_metadata[receiver] = {
                "id": receiver,
                "label": txn.get("receiver_name", receiver),
                "vpa": txn.get("receiver_vpa", ""),
                "bank": txn.get("receiver_bank", "Unknown"),
                "total_sent": 0.0,
                "total_received": 0.0,
                "txn_count": 0
            }

        self.node_metadata[sender]["total_sent"] += amount
        self.node_metadata[sender]["txn_count"] += 1
        self.node_metadata[receiver]["total_received"] += amount
        self.node_metadata[receiver]["txn_count"] += 1

        # Add or update edge
        if self.graph.has_edge(sender, receiver):
            self.graph[sender][receiver]["weight"] += amount
            self.graph[sender][receiver]["count"] += 1
            self.graph[sender][receiver]["txns"].append(txn_id)
        else:
            self.graph.add_edge(
                sender,
                receiver,
                weight=amount,
                count=1,
                rail=txn.get("rail", "UPI"),
                txns=[txn_id]
            )

    def detect_circular_flows(self, max_cycle_length: int = 5) -> List[List[str]]:
        """
        Detect closed cycles (round-tripping money laundering).
        e.g., A -> B -> C -> A
        """
        cycles = []
        try:
            simple_cycles = list(nx.simple_cycles(self.graph))
            for cycle in simple_cycles:
                if 2 < len(cycle) <= max_cycle_length:
                    cycles.append(cycle)
        except Exception:
            pass
        return cycles

    def detect_mule_hubs(self, min_in_degree: int = 3) -> List[Dict[str, Any]]:
        """
        Identify Mule / Aggregator Hubs:
        High incoming degree from multiple distinct accounts, combined with high velocity exit.
        """
        mule_candidates = []
        for node in self.graph.nodes:
            in_deg = self.graph.in_degree(node)
            out_deg = self.graph.out_degree(node)
            meta = self.node_metadata.get(node, {})
            received = meta.get("total_received", 0.0)
            sent = meta.get("total_sent", 0.0)

            # Fan-in pattern: Many senders pooling into one account
            if in_deg >= min_in_degree:
                ratio = (sent / received) if received > 0 else 0
                mule_candidates.append({
                    "account_id": node,
                    "name": meta.get("label", node),
                    "vpa": meta.get("vpa", ""),
                    "bank": meta.get("bank", ""),
                    "in_degree": in_deg,
                    "out_degree": out_deg,
                    "total_received": received,
                    "total_sent": sent,
                    "pass_through_ratio": round(ratio, 2),
                    "is_suspected_mule": in_deg >= 3 and ratio >= 0.80
                })
        return mule_candidates

    def detect_fan_out_dispersal(self, min_out_degree: int = 3) -> List[Dict[str, Any]]:
        """
        Identify Dispersal / Smurfing Hubs (1 source paying out to many unseasoned accounts).
        Detects syndicate fan-out where criminal proceeds are dispersed across fresh accounts.
        """
        dispersal = []
        for node in self.graph.nodes:
            out_deg = self.graph.out_degree(node)
            in_deg = self.graph.in_degree(node)
            meta = self.node_metadata.get(node, {})
            sent = meta.get("total_sent", 0.0)
            if out_deg >= min_out_degree:
                dispersal.append({
                    "account_id": node,
                    "out_degree": out_deg,
                    "in_degree": in_deg,
                    "total_sent": sent,
                    "is_suspected_dispersal": True
                })
        return dispersal

    def export_graph_for_visualization(self) -> Dict[str, Any]:
        """
        Export graph into standard D3 / Cytoscape / Vis format for frontend rendering.
        """
        nodes = []
        circular_nodes = set()
        for cycle in self.detect_circular_flows():
            circular_nodes.update(cycle)

        mule_ids = {m["account_id"] for m in self.detect_mule_hubs() if m["is_suspected_mule"]}

        for node_id in self.graph.nodes:
            meta = self.node_metadata.get(node_id, {})
            node_type = "NORMAL"
            if node_id in circular_nodes:
                node_type = "CIRCULAR_LAUNDERING"
            elif node_id in mule_ids:
                node_type = "MULE_AGGREGATOR"

            nodes.append({
                "id": node_id,
                "label": meta.get("label", node_id),
                "vpa": meta.get("vpa", ""),
                "bank": meta.get("bank", ""),
                "total_sent": meta.get("total_sent", 0),
                "total_received": meta.get("total_received", 0),
                "in_degree": self.graph.in_degree(node_id),
                "out_degree": self.graph.out_degree(node_id),
                "node_type": node_type
            })

        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "source": u,
                "target": v,
                "amount": data.get("weight", 0),
                "count": data.get("count", 1),
                "rail": data.get("rail", "UPI")
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "summary": {
                "total_accounts": len(nodes),
                "total_relations": len(edges),
                "circular_cycles_count": len(self.detect_circular_flows()),
                "mule_hubs_count": len(mule_ids)
            }
        }
