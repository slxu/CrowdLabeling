package project;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Properties;
import java.util.logging.Level;

import com.google.gson.Gson;

import javatools.administrative.D;
import javatools.filehandlers.DR;
import javatools.filehandlers.DW;
import edu.stanford.nlp.ie.machinereading.structure.EntityMention;
import edu.stanford.nlp.ie.machinereading.structure.MachineReadingAnnotations;
import edu.stanford.nlp.ie.machinereading.structure.Span;
import edu.stanford.nlp.ling.CoreAnnotations;
import edu.stanford.nlp.ling.CoreLabel;
import edu.stanford.nlp.pipeline.Annotation;
import edu.stanford.nlp.pipeline.StanfordCoreNLP;
import edu.stanford.nlp.util.CoreMap;
import edu.stanford.nlp.util.StringUtils;

class CorefMention {
	int id;
	int start;
	int end; // the mention does not include tokens[end]!
	String value; // string
	String corefId; // clustering result
	String shortName; // ...head...
}

class CorefSentence {
	List<String> tokens = new ArrayList<String>();
	List<CorefMention> mentions = new ArrayList<CorefMention>();

}

class CorefDatum {
	String docId;
	List<CorefSentence> sentences = new ArrayList<CorefSentence>();

	public CorefDatum(String docId) {
		this.docId = docId;
	}
}

class Item {
	int id;
	String fullText;
	String abbrText;
	String desc;
}

class ItemSet {
	String datasetName;
	List<Item> items = new ArrayList<Item>();
}

public class GenerateCoreferenceDataset {
	static Gson gson = new Gson();

	AceReader acereader;

	public GenerateCoreferenceDataset(String[] args) {
		Properties props = StringUtils.argsToProperties(args);
		acereader = new AceReader(new StanfordCoreNLP(props, false), false);
		acereader.setLoggerLevel(Level.INFO);
	}

	public static void fromAce2004ToCorefDatum(String input_dir, String output_json) throws IOException {
		BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(output_json), "utf-8"));
		Properties props = StringUtils.argsToProperties(new String[] {});
		AceReader acereader = new AceReader(new StanfordCoreNLP(props, false), false);
		acereader.setLoggerLevel(Level.INFO);
		Annotation annotation = acereader.parse(input_dir);
		HashMap<String, CorefDatum> docId2Coref = new HashMap<String, CorefDatum>();
		List<CoreMap> sentences = annotation.get(CoreAnnotations.SentencesAnnotation.class);
		int mentionId = 0;
		for (CoreMap sent : sentences) {
			String docId = sent.get(CoreAnnotations.DocIDAnnotation.class);
			if (!docId2Coref.containsKey(docId)) {
				docId2Coref.put(docId, new CorefDatum(docId));
			}
			CorefDatum cd = docId2Coref.get(docId);
			CorefSentence corefsentence = new CorefSentence();
			cd.sentences.add(corefsentence);
			List<CoreLabel> tokens = sent.get(CoreAnnotations.TokensAnnotation.class);
			for (CoreLabel l : tokens) {
				String word = l.get(CoreAnnotations.TextAnnotation.class);
				corefsentence.tokens.add(word);
			}
			List<EntityMention> mentions = sent.get(MachineReadingAnnotations.EntityMentionsAnnotation.class);
			if (mentions != null && mentions.size() > 0) {
				for (EntityMention m : mentions) {
					CorefMention cm = new CorefMention();
					cm.id = mentionId++;
					Span span = m.getExtent();
					cm.start = span.start();
					cm.end = span.end();
					{
						StringBuilder sb = new StringBuilder();
						for (int i = cm.start; i < cm.end; i++) {
							sb.append(corefsentence.tokens.get(i)).append(" ");
						}
						cm.value = sb.toString().trim();
					}

					cm.corefId = m.getCorefID();
					// get head
					{
						StringBuilder sb = new StringBuilder();
						if (m.getHeadTokenStart() > cm.start) {
							sb.append("..");
						}
						sb.append(corefsentence.tokens.get(m.getHeadTokenStart()));
						if (m.getHeadTokenEnd() < cm.end) {
							sb.append("..");
						}
						cm.shortName = sb.toString().trim();
					}
					corefsentence.tokens.get(m.getHeadTokenStart());
					m.getHeadTokenStart();
					// D.p(span.start(), span.end());
					// D.p(m.getCorefID());
					corefsentence.mentions.add(cm);
				}
			}
		}
		for (CorefDatum cd : docId2Coref.values()) {
			bw.write(gson.toJson(cd));
			bw.write("\n");

		}
		bw.close();
		// return docId2Coref;
	}

	public static void fromCorefDatum2Html(String input_json, String output_dir) throws IOException {
		if (!new File(output_dir).exists()) {
			new File(output_dir).mkdirs();
		}
		BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(input_json), "utf-8"));
		String l;
		while ((l = br.readLine()) != null) {
			CorefDatum cd = gson.fromJson(l, CorefDatum.class);
			fromCorefDatum2Html(cd, output_dir + "/" + cd.docId + ".html");
		}
		br.close();
	}

	public static void fromCorefDatum2Html(CorefDatum cd, String output) throws IOException {
		ItemSet is = fromCorefDatum2Itemset(cd);
		String head = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>" + cd.docId
				+ "</title><style>label{background-color:#d0e4fe;}</style></head><body>";
		BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(output), "utf-8"));
		bw.write("<!--" + gson.toJson(is) + "-->\n");
		bw.write(head + "\n");
		int idInDoc = 1;
		for (CorefSentence sent : cd.sentences) {
			HashMap<Integer, CorefMention> mentionstart2mention = new HashMap<Integer, CorefMention>();
			for (CorefMention cm : sent.mentions) {
				if (mentionstart2mention.containsKey(cm.start)) {
					int oldend = mentionstart2mention.get(cm.start).end;
					if (cm.end > oldend) {
						mentionstart2mention.put(cm.start, cm);
					}
				} else {
					mentionstart2mention.put(cm.start, cm);
				}
			}
			StringBuilder sb = new StringBuilder();
			sb.append("<p>");
			for (int i = 0; i < sent.tokens.size();) {
				if (mentionstart2mention.containsKey(i)) {
					CorefMention cm = mentionstart2mention.get(i);
					sb.append("<label class=\"" + cm.corefId + "\">");
					// sb.append("<b>[" + idInDoc++ + "]</b>");
					while (i < cm.end) {
						sb.append(sent.tokens.get(i));
						if (i < cm.end - 1)
							sb.append(' ');
						i++;
					}
					sb.append("</label> ");
				} else {
					sb.append(sent.tokens.get(i) + " ");
					i++;
				}
			}
			sb.append("</p>");
			bw.write(sb.toString() + '\n');
		}
		bw.write("</body></html>");
		bw.close();
	}

	public static ItemSet fromCorefDatum2Itemset(CorefDatum cd) {
		ItemSet is = new ItemSet();
		is.datasetName = cd.docId;
		for (CorefSentence sent : cd.sentences) {
			HashMap<Integer, CorefMention> mentionstart2mention = new HashMap<Integer, CorefMention>();
			for (CorefMention cm : sent.mentions) {
				if (mentionstart2mention.containsKey(cm.start)) {
					int oldend = mentionstart2mention.get(cm.start).end;
					if (cm.end > oldend) {
						mentionstart2mention.put(cm.start, cm);
					}
				} else {
					mentionstart2mention.put(cm.start, cm);
				}
			}
			for (int i = 0; i < sent.tokens.size();) {
				if (mentionstart2mention.containsKey(i)) {
					CorefMention cm = mentionstart2mention.get(i);
					Item item = new Item();
					is.items.add(item);
					item.fullText = cm.value;
					item.id = cm.id;
					item.abbrText = cm.shortName;
					StringBuilder sb = new StringBuilder();
					while (i < cm.end) {
						sb.append(sent.tokens.get(i));
						if (i < cm.end - 1)
							sb.append(' ');
						i++;
					}
					item.desc = sb.toString();
				} else {
					i++;
				}
			}
		}
		return is;
	}

	public static ItemSet fromCorefDatum2Itemset2(CorefDatum cd) {
		ItemSet is = new ItemSet();
		is.datasetName = cd.docId;
		for (CorefSentence cs : cd.sentences) {
			for (CorefMention cm : cs.mentions) {
				Item item = new Item();
				is.items.add(item);
				item.fullText = cm.value;
				item.id = cm.id;
				item.abbrText = cm.shortName;
				StringBuilder sb = new StringBuilder();
				for (int i = 0; i < cs.tokens.size(); i++) {
					if (i == cm.start) {
						sb.append("<b>");
					}
					sb.append(cs.tokens.get(i));
					if (i == cm.end - 1) {
						sb.append("</b>");
					}
					sb.append(" ");
				}
				item.desc = sb.toString();
			}
		}
		return is;
	}

	// public static void fromCorefDatum2Itemset(String input_corefdatumjson,
	// String output) throws IOException {
	// DR dr = new DR(input_corefdatumjson);
	// BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new
	// FileOutputStream(output), "utf-8"));
	// String[] l;
	// while ((l = dr.read()) != null) {
	// CorefDatum cd = gson.fromJson(l[0], CorefDatum.class);
	// ItemSet is = new ItemSet();
	// is.datasetName = cd.docId;
	// for (CorefSentence cs : cd.sentences) {
	// for (CorefMention cm : cs.mentions) {
	// Item item = new Item();
	// is.items.add(item);
	// item.name = cm.value;
	// item.id = cm.id;
	// StringBuilder sb = new StringBuilder();
	// for (int i = 0; i < cs.tokens.size(); i++) {
	// if (i == cm.start) {
	// sb.append("<b>");
	// }
	// sb.append(cs.tokens.get(i));
	// if (i == cm.end - 1) {
	// sb.append("</b>");
	// }
	// sb.append(" ");
	// }
	// item.desc = sb.toString();
	// }
	// }
	// bw.write(gson.toJson(is) + "\n");
	// }
	// bw.close();
	// dr.close();
	// }

	public static void main(String[] args) throws IOException {
		String acedir = "C:/Users/clzhang/Downloads/ace2004/ACE2004/data/English/nwire/";
		String json = "C:/Users/clzhang/Documents/GitHub/CrowdLabeling/data/coref_nwire.json";
		String itemsetjson = "C:/Users/clzhang/Documents/GitHub/CrowdLabeling/data/tocluster.json";
		String htmldir = "C:/Users/clzhang/Documents/GitHub/CrowdLabeling/data/corefhtml";
		fromAce2004ToCorefDatum(acedir, json);
		fromCorefDatum2Html(json, htmldir);
		// fromCorefDatum2Itemset(json, itemsetjson);

	}
}
