package project;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;

import com.google.gson.Gson;

import javatools.filehandlers.DW;
import javatools.string.StringUtil;
import edu.stanford.nlp.trees.LabeledScoredTreeFactory;
import edu.stanford.nlp.trees.Tree;
import edu.stanford.nlp.trees.TreeFactory;
import edu.stanford.nlp.trees.TreeReader;

class ParseTree {
	String name;
	List<ParseTree> children = new ArrayList<ParseTree>();
	List<String> tokens = new ArrayList<String>();

	// boolean isLeaf;
	public String getSentence() {
		if (children.size() == 0) {
			return name + " ";
		} else {
			StringBuilder sb = new StringBuilder();
			for (ParseTree pt : children) {
				sb.append(pt.getSentence());
			}
			return sb.toString();
		}

	}
}

public class GenerateTreeDataset {

	public static void copyTree2Node(Tree t, ParseTree node) {
		if (t.isLeaf()) {
			// node.isLeaf = true;
			node.name = t.nodeString();
			node.tokens.add(t.nodeString());
		} else {
			if (t.children().length == 1) {
				copyTree2Node(t.firstChild(), node);
			} else {
				// node.isLeaf = false;
				node.name = "";
				for (Tree c : t.children()) {
					ParseTree child = new ParseTree();
					copyTree2Node(c, child);
					node.children.add(child);
					node.tokens.addAll(child.tokens);
				}
				// node.name = StringUtil.join(node.tokens, " ");
			}
		}
	}

	public static void main(String[] args) {
		String penntreedir = "C:/Users/clzhang/Documents/GitHub/CrowdLabeling/data/pennTree";
		Gson gson = new Gson();
		try {
			TreeFactory tf = new LabeledScoredTreeFactory();
			DW dwjson = new DW(penntreedir + "/trees.json");
			DW dws = new DW(penntreedir + "/trees.txt");
			Reader r = new BufferedReader(new InputStreamReader(new FileInputStream(penntreedir + "/wsj_0003.mrg"),
					"UTF-8"));
			TreeReader tr = new PennTreeReader(r, tf);
			List<Tree> trees = new ArrayList<Tree>();
			Tree t = tr.readTree();
			trees.add(t);
			while (t != null) {
				trees.add(t);
				t = tr.readTree();
			}
			r.close();
			for (int i = 0; i < trees.size(); i++) {
				Tree tree = trees.get(i);
				ParseTree parsetree = new ParseTree();
				copyTree2Node(tree, parsetree);
				dwjson.write(gson.toJson(parsetree));
				dws.write(StringUtil.join(parsetree.tokens, " "));
				// {
				// DW dw0 = new DW(penntreedir + "/test/" + i + ".json");
				// dw0.close();
				// }
				// System.out.println(gson.toJson(parsetree.tokens));
			}
			dwjson.close();
			dws.close();
		} catch (IOException ioe) {
			ioe.printStackTrace();
		}
	}
}
