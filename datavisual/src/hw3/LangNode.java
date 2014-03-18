package hw3;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class LangNode {
	String name;
	String parent = "";
	String colour;
	List<LangNode> children;
	Set<String>insideleafs = new HashSet<String>();
	String inside="";
	String outside="";

	public LangNode(String name, String parent) {
		this.name = name;
		this.parent = parent;
		this.colour = "#ebe378";
		children = new ArrayList<LangNode>();
	}
	
}
