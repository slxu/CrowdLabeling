package english;

import java.net.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.io.*;

import javatools.filehandlers.DR;
import javatools.filehandlers.DW;
import javatools.string.StringUtil;

public class Youdao {
	// static String dir =
	// "O:/unix/projects/pardosa/s5/clzhang/youdao/barron1100";

	// static String dir = "O:/unix/projects/pardosa/s5/clzhang/youdao/gre";

	static String dir = "O:/unix/projects/pardosa/s5/clzhang/youdao/fulllist";

	// static String dir =
	// "O:/unix/projects/pardosa/s5/clzhang/youdao/barron1000";

	public static void main(String[] args) throws Exception {
		if (args.length > 0) {
			dir = args[0];
		}
		htmls();
		parseHtml();
		// parseHtmlFromWordlist();
	}
	//nnmf
	public static void main2(String[] args) throws Exception {

		URL oracle = new URL(
				"http://dict.youdao.com/search?q=venue&keyfrom=dict.index#q%3Dvenue%26keyfrom%3Ddict.index");
		BufferedReader in = new BufferedReader(new InputStreamReader(oracle.openStream(), "UTF-8"));

		String a = "C:/Users/clzhang/Downloads/a.html";
		BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(a), "utf-8"));
		String inputLine;
		StringBuilder sb = new StringBuilder();
		while ((inputLine = in.readLine()) != null) {
			sb.append(inputLine + "\n");
			// bw.write(inputLine + "\n");
		}
		String collins = takeCollins(sb.toString());
		bw.write(collins);
		in.close();
		bw.close();
	}

	public static void htmls() throws Exception {
		DR dr = new DR(dir + "/wordlist");
		String outputdir = dir + "/htmls";
		HashSet<String> crawledwords = new HashSet<String>();
		{
			File f = new File(outputdir);
			if (!f.exists()) {
				f.mkdir();
			}
			String[] list = f.list();
			for (String w : list) {
				w = w.replace(".html", "");
				crawledwords.add(w);
			}
		}
		String[] l;

		DW dw = new DW(dir + "/audio/wgetaudio.sh");
		while ((l = dr.read()) != null) {
			String w = l[0].trim();
			if (w.indexOf(' ') < 0 && !new File(dir + "/audio/" + w + ".mp3").exists() &&
					StringUtil.containOnlyLetter(w)) {
				dw.write("wget https://ssl.gstatic.com/dictionary/static/sounds/de/0/" + w + ".mp3");
			}
			if (!crawledwords.contains(w) && StringUtil.containOnlyLetter(w)) {
				System.out.println(w);
				try {
					crawlOneWord(w, dir + "/htmls");
				} catch (Exception e) {
					e.printStackTrace();
				}
				Thread.sleep(1000);
			}
		}
		dr.close();

		dw.close();
	}

	public static void parseHtmlFromWordlist() throws Exception {
		DR dr = new DR(dir + "/wordlist");
		BufferedWriter bw = new BufferedWriter(
				new OutputStreamWriter(new FileOutputStream(dir + "/look.html"), "utf-8"));
		{
			BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream(dir + "/head"), "utf-8"));
			String l;
			StringBuilder sb = new StringBuilder();
			while ((l = in.readLine()) != null) {
				sb.append(l + "\n");
			}
			bw.write(sb.toString());
			in.close();
		}
		String[] ll;
		while ((ll = dr.read()) != null) {
			String w = ll[0].trim();
			String file = dir + "/htmls/" + w + ".html";
			if ((new File(file)).exists()) {
				BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream(file), "utf-8"));
				String l;
				StringBuilder sb = new StringBuilder();
				while ((l = in.readLine()) != null) {
					sb.append(l);
				}
				String s = takeCollins(sb.toString());
				if (s.length() < 10) {
					bw.write("<h3>" + w + "</h3>");
				} else {
					bw.write(s);
				}
			} else {
				bw.write("<h3>" + w + "</h3>");
			}
		}
		dr.close();
		bw.close();
	}

	public static void parseHtml() throws Exception {
		String inputdir = dir + "/htmls";
		File f = new File(inputdir);
		// String[] list = f.list();
		List<String> list = new ArrayList<String>();
		{
			DR dr = new DR(dir + "/wordlist");
			String[] l;
			while ((l = dr.read()) != null) {
				list.add(l[0]);
			}
			dr.close();
		}
		BufferedWriter bw = new BufferedWriter(
				new OutputStreamWriter(new FileOutputStream(dir + "/look.html"), "utf-8"));

		{
			BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream(dir + "/head"), "utf-8"));
			String l;
			StringBuilder sb = new StringBuilder();
			while ((l = in.readLine()) != null) {
				sb.append(l + "\n");
			}
			bw.write(sb.toString());
			in.close();
		}
		Set<String> uniq = new TreeSet<String>(list);
		for (String w : uniq) {
			// for (String w : list) {
			String file = inputdir + "/" + w + ".html";
			BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream(file), "utf-8"));
			String l;
			StringBuilder sb = new StringBuilder();
			while ((l = in.readLine()) != null) {
				sb.append(l);
			}
			String s = takeCollins(sb.toString());
			if (s.length() == 0) {
				s = take21centries(sb.toString());
			}
			String word = w.trim();
			if (word.indexOf(' ') < 0) {
				bw.write(insertAudio(word) + "\n");
			}
			bw.write(s + "\n");
			// break;
		}
		bw.close();
	}

	public static void crawlOneWord(String w, String outputdir) throws Exception {
		String url = "http://dict.youdao.com/search?q=" + w + "&keyfrom=dict.index#q%3D" + w
				+ "%26keyfrom%3Ddict.index";
		URL oracle = new URL(url);
		BufferedReader in = new BufferedReader(new InputStreamReader(oracle.openStream(), "UTF-8"));

		BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(outputdir + "/" + w
				+ ".html"), "utf-8"));
		String inputLine;
		StringBuilder sb = new StringBuilder();
		while ((inputLine = in.readLine()) != null) {
			sb.append(inputLine + "\n");
			// bw.write(inputLine + "\n");
		}
		// String collins = takeCollins(sb.toString());
		bw.write(sb.toString());
		in.close();
		bw.close();
	}

	public static String insertAudio(String word) {

		// String s = "<a href=\"audio\\" + word + ".mp3\">Play the sound</a>";
		String s = "<input type=\"button\" value=\"mp3\" onclick=play(\"" + word + "\")></a>";
		// String s = "<audio controls><source src=\"audio/" + word
		// +
		// ".mp3\" type=\"audio/mpeg\"> Your browser does not support this audio format.</audio>";

		// String s =
		// "<span class=\"lr_dct_spkr lr_dct_spkr_off\" title=\"Listen\" jsaction=\"dob.p\" data-log-string=\"pronunciation-icon-click\" style=\"display: inline-block;\"><input src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAcUlEQVQ4y2P4//8/AyUYQhAH3gNxA7IAIQPmo/H3g/QA8XkgFiBkwHyoYnRQABVfj88AmGZcTuuHyjlgMwBZM7IE3NlQGhQe65EN+I8Dw8MLGgYoFpFqADK/YUAMwOsFigORatFIlYRElaRMWmaiBAMAp0n+3U0kqkAAAAAASUVORK5CYII=\" height=\"16\" type=\"image\" width=\"16\" style=\"height:16px;width:16px\"><audio src=\""
		// + "audio\\"
		// + word
		// +
		// ".mp3\" data-dobid=\"aud\" oncanplaythrough=\"this.parentNode.style.display = 'inline-block'\" preload=\"auto\"></audio></span>";
		return s;
	}

	public static String takeCollins(String s) {
		// find <div id="collins"
		// find all <div
		// find all </div>
		class Pair {
			int start;
			int type;

			public Pair(int start, int type) {
				this.start = start;
				this.type = type;
			}
		}

		String result = "";
		int collinsstart = s.indexOf("<div id=\"collinsResult\"");
		if (collinsstart < 0) {
			return "";
		} else {
			String ss = s.substring(collinsstart);
			List<Pair> pairs = new ArrayList<Pair>();
			Pattern p1 = Pattern.compile("<div");
			Matcher m1 = p1.matcher(ss);
			while (m1.find()) {
				int start = m1.start();
				pairs.add(new Pair(start, 1));
			}
			Pattern p2 = Pattern.compile("</div>");
			Matcher m2 = p2.matcher(ss);
			while (m2.find()) {
				int end = m2.end();
				pairs.add(new Pair(end, 2));
			}
			Collections.sort(pairs, new Comparator<Pair>() {

				@Override
				public int compare(Pair arg0, Pair arg1) {
					// TODO Auto-generated method stub
					return arg0.start - arg1.start;
				}

			});
			int flag = 0;
			for (int i = 0; i < pairs.size(); i++) {
				Pair p = pairs.get(i);
				if (p.type == 1) {
					flag++;
				} else {
					flag--;
				}
				if (flag == 0 && p.start != 0) {
					result = ss.substring(0, p.start);
					return result;
				}
			}
		}
		return "";
	}

	public static String take21centries(String s) {
		// find <div id="collins"
		// find all <div
		// find all </div>
		class Pair {
			int start;
			int type;

			public Pair(int start, int type) {
				this.start = start;
				this.type = type;
			}
		}

		String result = "";
		int collinsstart = s
				.indexOf("<div class=\"trans-container tab-content hide more-collapse\" id=\"authDictTrans\">");
		if (collinsstart < 0) {
			return "";
		} else {
			String ss = s.substring(collinsstart);
			List<Pair> pairs = new ArrayList<Pair>();
			Pattern p1 = Pattern.compile("<div");
			Matcher m1 = p1.matcher(ss);
			while (m1.find()) {
				int start = m1.start();
				pairs.add(new Pair(start, 1));
			}
			Pattern p2 = Pattern.compile("</div>");
			Matcher m2 = p2.matcher(ss);
			while (m2.find()) {
				int end = m2.end();
				pairs.add(new Pair(end, 2));
			}
			Collections.sort(pairs, new Comparator<Pair>() {

				@Override
				public int compare(Pair arg0, Pair arg1) {
					// TODO Auto-generated method stub
					return arg0.start - arg1.start;
				}

			});
			int flag = 0;
			for (int i = 0; i < pairs.size(); i++) {
				Pair p = pairs.get(i);
				if (p.type == 1) {
					flag++;
				} else {
					flag--;
				}
				if (flag == 0 && p.start != 0) {
					result = ss.substring(0, p.start);
					return result;
				}
			}
		}
		return "";
	}

}
