package project;

import java.io.File;
import java.io.IOException;
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
	int start;
	int end; // the mention does not include tokens[end]!
	String value; // string
	String corefId; // clustering result
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

public class GenerateCoreferenceDataset {
	static Gson gson = new Gson();

	AceReader acereader;

	public GenerateCoreferenceDataset(String[] args) {
		Properties props = StringUtils.argsToProperties(args);
		acereader = new AceReader(new StanfordCoreNLP(props, false), false);
		acereader.setLoggerLevel(Level.INFO);
	}

	public static void fromAce2004ToCorefDatum(String input_dir, String output_json) throws IOException {
		DW dw = new DW(output_json);
		Properties props = StringUtils.argsToProperties(new String[] {});
		AceReader acereader = new AceReader(new StanfordCoreNLP(props, false), false);
		acereader.setLoggerLevel(Level.INFO);
		Annotation annotation = acereader.parse(input_dir);
		HashMap<String, CorefDatum> docId2Coref = new HashMap<String, CorefDatum>();
		List<CoreMap> sentences = annotation.get(CoreAnnotations.SentencesAnnotation.class);
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
					Span span = m.getExtent();
					cm.start = span.start();
					cm.end = span.end();
					cm.value = m.getValue();
					cm.corefId = m.getCorefID();
					// D.p(span.start(), span.end());
					// D.p(m.getCorefID());
					corefsentence.mentions.add(cm);
				}
			}
		}
		for (CorefDatum cd : docId2Coref.values()) {
			dw.write(gson.toJson(cd));

		}
		dw.close();
		// return docId2Coref;
	}

	public static void fromCorefDatum2Html(String input_json, String output_dir) {
		if (!new File(output_dir).exists()) {
			new File(output_dir).mkdirs();
		}
		DR dr = new DR(input_json);
		String[] l;
		while ((l = dr.read()) != null) {
			CorefDatum cd = gson.fromJson(l[0], CorefDatum.class);
			fromCorefDatum2Html(cd, output_dir + "/" + cd.docId + ".html");
		}
		dr.close();
	}

	public static void fromCorefDatum2Html(CorefDatum cd, String output) {
		String head = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>" + cd.docId
				+ "</title><style>label{background-color:#d0e4fe;}</style></head><body>";
		DW dw = new DW(output);
		dw.write(head);
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
			dw.write(sb.toString());
		}
		dw.write("</body></html>");
		dw.close();
	}

	public static void main(String[] args) throws IOException {
		String acedir = "C:/Users/clzhang/Downloads/ace2004/ACE2004/data/English/nwire/";
		String json = "C:/Users/clzhang/Documents/GitHub/CrowdLabeling/data/coref_nwire.json";
		String htmldir = "C:/Users/clzhang/Documents/GitHub/CrowdLabeling/data/corefhtml";
		// fromAce2004ToCorefDatum(acedir, json);
		fromCorefDatum2Html(json, htmldir);
	}
}
