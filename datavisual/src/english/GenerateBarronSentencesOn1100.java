package english;

import java.util.HashMap;

import javatools.administrative.D;
import javatools.filehandlers.DR;

public class GenerateBarronSentencesOn1100 {

	static String dir = "O:/unix/projects/pardosa/s5/clzhang/youdao/barron1000";
	static String barron4000 = dir + "/barron4000w_sentence";

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		HashMap<String, String[]> map = new HashMap<String, String[]>();
		{
			DR dr = new DR(barron4000);
			String[] l;
			String lastword = "";
			String lastmeaning = "";
			StringBuilder sb = new StringBuilder();
			while ((l = dr.read()) != null) {
				if (l.length == 2) {
					if (lastword.length() > 0) {
						map.put(lastword, new String[] { lastword, lastmeaning, sb.toString().trim() });
						sb = new StringBuilder();
					}
					lastword = l[0];
					lastmeaning = l[1];
				} else {
					sb.append(l[0]).append(" ");
				}
			}
			dr.close();
		}
		D.p(map.size());
		{
			DR dr = new DR(dir + "/wordlist");
			String[] l;
			int k=0;
			while ((l = dr.read()) != null) {
				String word = l[0];
				if (map.containsKey(word)) {
					String[] w = map.get(word);
//					D.p(word, w[1], w[2]);
				}else{
					D.p(word);
					k++;
				}
			}
			D.p(k);
			dr.close();
		}

	}
}
