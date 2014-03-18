package hw3;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;

import com.google.gson.Gson;

import javatools.filehandlers.DR;
import javatools.filehandlers.DW;

public class Main1 {

	public static void generateJson(String input, String output) {
		DR dr = new DR(input);
		String[] l = dr.read();
		HashMap<String, LangNode> str2langnode = new HashMap<String, LangNode>();
		List<String> allleafs = new ArrayList<String>();
		// StringBuilder sb_leafs = new StringBuilder();
		LangNode root = new LangNode(l[0], "");
		str2langnode.put(root.name, root);
		while ((l = dr.read()) != null) {
			LangNode node = new LangNode(l[0], l[1]);
			str2langnode.put(node.name, node);
		}
		dr.close();
		// set up children
		for (Entry<String, LangNode> e : str2langnode.entrySet()) {
			LangNode ln = e.getValue();
			if (!ln.parent.equals("")) {
				LangNode parent = str2langnode.get(ln.parent);
				parent.children.add(ln);
			}
		}
		// set up color
		// print out leaf nodes
		for (Entry<String, LangNode> e : str2langnode.entrySet()) {
			LangNode ln = e.getValue();
			if (ln.children.size() == 0) {
				allleafs.add(ln.name);
				// sb_leafs.append("." + ln.name + ",");
			}
		}
		// set up inside outside
		setupInsideIteratively(root);

		Gson gson = new Gson();
		DW dw = new DW(output);
		dw.write("[");
		for (int i = 0; i < root.children.size(); i++) {
			// for (LangNode ln : root.children) {
			LangNode ln = root.children.get(i);
			dw.write(gson.toJson(ln));
			if (i < root.children.size() - 1) {
				dw.write(",");
			}
		}

		dw.write("]");
		dw.close();

	}

	public static void setupInsideIteratively(LangNode node) {
		if (node.children.size() == 0) {
			node.inside = "inside_" + node.name;
			node.insideleafs.add(node.name);
			// for (String s : allleafs) {
			// if (!node.insideleafs.contains(s)) {
			// node.outside += "." + s + ",";
			// }
			// }
			// if (node.outside != null && node.outside.length() > 0)
			// node.outside = node.outside.substring(0, node.outside.length() -
			// 1);
		} else {
			StringBuilder sb = new StringBuilder();

			for (int i = 0; i < node.children.size(); i++) {
				// for (LangNode ln : node.children) {
				LangNode ln = node.children.get(i);
				setupInsideIteratively(ln);
				node.insideleafs.addAll(ln.insideleafs);

				// if (i < node.children.size() - 1)
				// sb.append(ln.inside + ',');
				// else
				// sb.append(ln.inside);
			}
			for (String s : node.insideleafs) {
				node.inside += "inside_" + s + " ";
			}
			node.inside = node.inside.trim();
			// for (String s : allleafs) {
			// if (!node.insideleafs.contains(s)) {
			// node.outside += "." + s + ",";
			// }
			// }
			// node.inside = node.inside.substring(0, node.inside.length() - 1);
			// if (node.outside != null && node.outside.length() > 0)
			// node.outside = node.outside.substring(0, node.outside.length() -
			// 1);
		}
	}

	// public static void setupOutsideIteratively(LangNode node) {
	// if (node.children.size() == 0) {
	// node.inside = "." + node.name;
	// } else {
	// StringBuilder sb = new StringBuilder();
	//
	// for (int i = 0; i < node.children.size(); i++) {
	// // for (LangNode ln : node.children) {
	// LangNode ln = node.children.get(i);
	// setupInsideIteratively(ln);
	// if (i < node.children.size() - 1)
	// sb.append(ln.inside + ',');
	// else
	// sb.append(ln.inside);
	// }
	// node.inside = sb.toString().trim();
	// }
	// }

	public static void fromStr2Color(String s) {

	}

	public static void main(String[] args) {
		String dir = "C:/Users/clzhang/Dropbox/CSE512_A3_NiedZhang/cse512hw3";
		generateJson(dir + "/language_tree3", dir + "/language_tree3.json");
	}
}
