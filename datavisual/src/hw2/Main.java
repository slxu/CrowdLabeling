package hw2;

import java.util.HashSet;
import java.util.Set;

import edu.stanford.nlp.stats.ClassicCounter;
import edu.stanford.nlp.stats.Counter;
import javatools.administrative.D;
import javatools.filehandlers.DR;

class Flight {
	/**
	 * 0 YEAR 1 MONTH 2 DAY_OF_MONTH 3 DAY_OF_WEEK 4 UNIQUE_CARRIER 5 AIRLINE_ID
	 * 6 CARRIER 7 TAIL_NUM 8 FL_NUM 9 ORIGIN 10 ORIGIN_CITY_NAME 11
	 * ORIGIN_STATE_ABR 12 ORIGIN_STATE_NM 13 ORIGIN_WAC 14 DEST 15
	 * DEST_CITY_NAME 16 DEST_STATE_ABR 17 DEST_STATE_NM 18 DEST_WAC 19
	 * CRS_DEP_TIME 20 DEP_TIME 21 DEP_DELAY 22 CRS_ARR_TIME 23 ARR_TIME 24
	 * ARR_DELAY 25 CANCELLED 26 CANCELLATION_CODE 27 DIVERTED 28 AIR_TIME 29
	 * DISTANCE 30 CARRIER_DELAY 31 WEATHER_DELAY 32 NAS_DELAY 33 SECURITY_DELAY
	 * 34 LATE_AIRCRAFT_DELAY 35
	 * */

	int day_of_month;// 2
	String carrier; // 4
	int day_of_week;// 3
	int crs_arr_time = 0;// 22
	double arr_delay = 0;// 24
	double weather_delay = 0;// 31

	public Flight(String[] l) {
		this.day_of_month = Integer.parseInt(l[2]);
		this.day_of_week = Integer.parseInt(l[3]);
		this.arr_delay = getDoubleValue(l[24]);
		this.weather_delay = getDoubleValue(l[31]);
		this.carrier = l[4];
	}

	public double getDoubleValue(String str) {
		if (str.length() > 0) {
			return Double.parseDouble(str);
		} else
			return 0;
	}

}

public class Main {

	public static void showmecolumnname(String input) {
		DR dr = new DR(input);
		String[] l = dr.read();
		for (int i = 0; i < l.length; i++) {
			D.p(i, l[i]);
		}
		dr.close();
	}

	public static void arr_delay2day_of_week(String input) {
		DR dr = new DR(input);
		String[] l = dr.read();
		double[] sum_arr_delay = new double[8];
		int[] numflight_delayed = new int[8];
		int[] numflight = new int[8];
		while ((l = dr.read()) != null) {
			Flight f = new Flight(l);
			numflight[f.day_of_week]++;
			if (f.arr_delay > 0) {
				numflight_delayed[f.day_of_week]++;
				sum_arr_delay[f.day_of_week] += f.arr_delay;
			}
		}
		dr.close();
		D.p("DELAY ODDS");
		for (int i = 1; i < 8; i++) {
			D.p("day_of_week", i, numflight_delayed[i] * 1.0 / numflight[i]);
		}
		D.p("AVERAGE DELAY TIMES");
		for (int i = 1; i < 8; i++) {
			D.p("day_of_week", i, sum_arr_delay[i] * 1.0 / numflight_delayed[i]);
		}
		D.p("Expected DELAY TIMES");
		for (int i = 1; i < 8; i++) {
			D.p("day_of_week", i, sum_arr_delay[i] * 1.0 / numflight[i]);
		}
		{
			int weekdays_numflights = 0;
			int weekdays_numflights_delayed = 0;
			double sum_weekdays_numflights_delayed_minutes = 0;
			int weekends_numflights = 0;
			int weekends_numflights_delayed = 0;
			double sum_weekends_numflights_delayed_minutes = 0;
			for (int i = 1; i < 8; i++) {
				if (i <= 5) {
					weekdays_numflights += numflight[i];
					weekdays_numflights_delayed += numflight_delayed[i];
					sum_weekdays_numflights_delayed_minutes += sum_arr_delay[i];
				} else {
					weekends_numflights += numflight[i];
					weekends_numflights_delayed += numflight_delayed[i];
					sum_weekends_numflights_delayed_minutes += sum_arr_delay[i];
				}
			}
			D.p("WEEKDAYS vs WEEKENDS DELAY ODDS");
			D.p("WEEKDAYS", weekdays_numflights_delayed * 1.0 / weekdays_numflights);
			D.p("WEEKENDS", weekends_numflights_delayed * 1.0 / weekends_numflights);

			D.p("WEEKDAYS vs WEEKENDS AVG DELAY TIME");
			D.p("WEEKDAYS", sum_weekdays_numflights_delayed_minutes * 1.0 / weekdays_numflights_delayed);
			D.p("WEEKENDS", sum_weekends_numflights_delayed_minutes * 1.0 / weekends_numflights_delayed);

			D.p("WEEKDAYS vs WEEKENDS Expected DELAY TIME");
			D.p("WEEKDAYS", sum_weekdays_numflights_delayed_minutes * 1.0 / weekdays_numflights);
			D.p("WEEKENDS", sum_weekends_numflights_delayed_minutes * 1.0 / weekends_numflights);
		}

	}

	public static void arr_delay_notweather2day_of_week(String input) {
		DR dr = new DR(input);
		String[] l = dr.read();
		double[] sum_arr_delay = new double[8];
		int[] numflight_delayed = new int[8];
		int[] numflight = new int[8];

		while ((l = dr.read()) != null) {
			Flight f = new Flight(l);
			numflight[f.day_of_week]++;
			if (f.arr_delay > 0 && f.weather_delay == 0) {
				numflight_delayed[f.day_of_week]++;
				sum_arr_delay[f.day_of_week] += f.arr_delay - f.weather_delay;
			}
		}
		dr.close();
		D.p("DELAY ODDS w/o weather delay");
		for (int i = 1; i < 8; i++) {
			D.p("day_of_week", i, numflight_delayed[i] * 1.0 / numflight[i]);
		}
		D.p("AVERAGE DELAY TIMES w/o weather delay");
		for (int i = 1; i < 8; i++) {
			D.p("day_of_week", i, sum_arr_delay[i] * 1.0 / numflight_delayed[i]);
		}

		{
			int weekdays_numflights = 0;
			int weekdays_numflights_delayed = 0;
			double sum_weekdays_numflights_delayed_minutes = 0;
			int weekends_numflights = 0;
			int weekends_numflights_delayed = 0;
			double sum_weekends_numflights_delayed_minutes = 0;
			for (int i = 1; i < 8; i++) {
				if (i <= 5) {
					weekdays_numflights += numflight[i];
					weekdays_numflights_delayed += numflight_delayed[i];
					sum_weekdays_numflights_delayed_minutes += sum_arr_delay[i];
				} else {
					weekends_numflights += numflight[i];
					weekends_numflights_delayed += numflight_delayed[i];
					sum_weekends_numflights_delayed_minutes += sum_arr_delay[i];
				}
			}
			D.p("WEEKDAYS vs WEEKENDS DELAY ODDS w/o weather delay");
			D.p("WEEKDAYS", weekdays_numflights_delayed * 1.0 / weekdays_numflights);
			D.p("WEEKENDS", weekends_numflights_delayed * 1.0 / weekends_numflights);

			D.p("WEEKDAYS vs WEEKENDS DELAY TIME w/o weather delay");
			D.p("WEEKDAYS", sum_weekdays_numflights_delayed_minutes * 1.0 / weekdays_numflights_delayed);
			D.p("WEEKENDS", sum_weekends_numflights_delayed_minutes * 1.0 / weekends_numflights_delayed);
		}

	}

	public static void arr_day2day_of_week_byweek(String input) {
		DR dr = new DR(input);
		String[] l = dr.read();
		Set<String> carriers = new HashSet<String>();
		Counter<String> numflights = new ClassicCounter<String>();
		Counter<String> delayflights = new ClassicCounter<String>();
		Counter<String> delayminutes = new ClassicCounter<String>();
		while ((l = dr.read()) != null) {
			Flight f = new Flight(l);
			String week = "w" + (f.day_of_month / 7 + 1);
			int day = f.day_of_week;
			String isWeekday = day <= 5 ? "weekday" : "weekend";
			numflights.incrementCount(week + "\t" + isWeekday);
			if (f.arr_delay > 0) {
				delayflights.incrementCount(week + "\t" + isWeekday);
				delayminutes.incrementCount(week + "\t" + isWeekday, f.arr_delay);
				// numflight_delayed[f.day_of_week]++;
				// sum_arr_delay[f.day_of_week] += f.arr_delay;
			}
			carriers.add(week);
		}
		dr.close();
		D.p("Compare company delay odds");
		for (String carrier : carriers) {
			String k = carrier + "\tweekend";
			double weekend_delayodd = delayflights.getCount(k) / numflights.getCount(k);
			double weekend_delaytime = delayminutes.getCount(k) / delayflights.getCount(k);
			double weekend_expectdelaytime = delayminutes.getCount(k) / numflights.getCount(k);
			k = carrier + "\tweekday";
			double weekday_delayodd = delayflights.getCount(k) / numflights.getCount(k);
			double weekday_delaytime = delayminutes.getCount(k) / delayflights.getCount(k);
			double weekday_expectdelaytime = delayminutes.getCount(k) / numflights.getCount(k);
			D.p(carrier, weekend_delayodd - weekday_delayodd,
					weekend_delaytime - weekday_delaytime,
					weekend_expectdelaytime - weekday_expectdelaytime);
		}
	}

	public static void arr_day2day_of_week_bycarrier(String input) {
		DR dr = new DR(input);
		String[] l = dr.read();
		Set<String> carriers = new HashSet<String>();
		Counter<String> numflights = new ClassicCounter<String>();
		Counter<String> delayflights = new ClassicCounter<String>();
		Counter<String> delayminutes = new ClassicCounter<String>();
		while ((l = dr.read()) != null) {
			Flight f = new Flight(l);
			String carrier = f.carrier;
			int day = f.day_of_week;
			String isWeekday = day <= 5 ? "weekday" : "weekend";
			numflights.incrementCount(carrier + "\t" + isWeekday);
			if (f.arr_delay > 0) {
				delayflights.incrementCount(carrier + "\t" + isWeekday);
				delayminutes.incrementCount(carrier + "\t" + isWeekday, f.arr_delay);
				// numflight_delayed[f.day_of_week]++;
				// sum_arr_delay[f.day_of_week] += f.arr_delay;
			}
			carriers.add(carrier);
		}
		dr.close();
		D.p("Compare company delay odds");
		for (String carrier : carriers) {
			String k = carrier + "\tweekend";
			double weekend_delayodd = delayflights.getCount(k) / numflights.getCount(k);
			double weekend_delaytime = delayminutes.getCount(k) / delayflights.getCount(k);
			double weekend_expectdelaytime = delayminutes.getCount(k) / numflights.getCount(k);
			k = carrier + "\tweekday";
			double weekday_delayodd = delayflights.getCount(k) / numflights.getCount(k);
			double weekday_delaytime = delayminutes.getCount(k) / delayflights.getCount(k);
			double weekday_expectdelaytime = delayminutes.getCount(k) / numflights.getCount(k);
			D.p(carrier, weekend_delayodd - weekday_delayodd,
					weekend_delaytime - weekday_delaytime,
					weekend_expectdelaytime - weekday_expectdelaytime);
		}
		D.p("DELAY ODDS");
		// for (String k : numflights.keySet()) {
		// double delayodd = delayflights.getCount(k) / numflights.getCount(k);
		// double delaytime = delayminutes.getCount(k) /
		// delayflights.getCount(k);
		// double expectdelaytime = delayminutes.getCount(k) /
		// numflights.getCount(k);
		// D.p(k, delayodd, delaytime, expectdelaytime, numflights.getCount(k),
		// delayflights.getCount(k),
		// delayminutes.getCount(k));
		// }
	}

	public static void thursday_rest(String input) {
		DR dr = new DR(input);
		String[] l = dr.read();
		Set<String> carriers = new HashSet<String>();
		Counter<String> numflights = new ClassicCounter<String>();
		Counter<String> delayflights = new ClassicCounter<String>();
		Counter<String> delayminutes = new ClassicCounter<String>();
		while ((l = dr.read()) != null) {
			Flight f = new Flight(l);
			String carrier = f.carrier;
			int day = f.day_of_week;
			String isThursday = day == 4 ? "Thursday" : "NotThursday";
			numflights.incrementCount(carrier + "\t" + isThursday);
			if (f.arr_delay > 0) {
				delayflights.incrementCount(carrier + "\t" + isThursday);
				delayminutes.incrementCount(carrier + "\t" + isThursday, f.arr_delay);
				// numflight_delayed[f.day_of_week]++;
				// sum_arr_delay[f.day_of_week] += f.arr_delay;
			}
			carriers.add(carrier);
		}
		dr.close();
		D.p("Compare company delay odds");
		for (String carrier : carriers) {
			String k = carrier + "\tThursday";
			double weekend_delayodd = delayflights.getCount(k) / numflights.getCount(k);
			double weekend_delaytime = delayminutes.getCount(k) / delayflights.getCount(k);
			double weekend_expectdelaytime = delayminutes.getCount(k) / numflights.getCount(k);
			k = carrier + "\tNotThursday";
			double weekday_delayodd = delayflights.getCount(k) / numflights.getCount(k);
			double weekday_delaytime = delayminutes.getCount(k) / delayflights.getCount(k);
			double weekday_expectdelaytime = delayminutes.getCount(k) / numflights.getCount(k);
			D.p(carrier, weekend_delayodd - weekday_delayodd,
					weekend_delaytime - weekday_delaytime,
					weekend_expectdelaytime - weekday_expectdelaytime);
		}
		D.p("DELAY ODDS");
	}

	public static void thursday_rest_byweek(String input) {
		DR dr = new DR(input);
		String[] l = dr.read();
		Set<String> carriers = new HashSet<String>();
		Counter<String> numflights = new ClassicCounter<String>();
		Counter<String> delayflights = new ClassicCounter<String>();
		Counter<String> delayminutes = new ClassicCounter<String>();
		while ((l = dr.read()) != null) {
			Flight f = new Flight(l);
			String carrier = f.day_of_month / 7 + "";
			int day = f.day_of_week;
			String isThursday = day == 4 ? "Thursday" : "NotThursday";
			numflights.incrementCount(carrier + "\t" + isThursday);
			if (f.arr_delay > 0) {
				delayflights.incrementCount(carrier + "\t" + isThursday);
				delayminutes.incrementCount(carrier + "\t" + isThursday, f.arr_delay);
				// numflight_delayed[f.day_of_week]++;
				// sum_arr_delay[f.day_of_week] += f.arr_delay;
			}
			carriers.add(carrier);
		}
		dr.close();
		D.p("Compare company delay odds");
		for (String carrier : carriers) {
			String k = carrier + "\tThursday";
			double weekend_delayodd = delayflights.getCount(k) / numflights.getCount(k);
			double weekend_delaytime = delayminutes.getCount(k) / delayflights.getCount(k);
			double weekend_expectdelaytime = delayminutes.getCount(k) / numflights.getCount(k);
			k = carrier + "\tNotThursday";
			double weekday_delayodd = delayflights.getCount(k) / numflights.getCount(k);
			double weekday_delaytime = delayminutes.getCount(k) / delayflights.getCount(k);
			double weekday_expectdelaytime = delayminutes.getCount(k) / numflights.getCount(k);
			D.p(carrier, weekend_delayodd - weekday_delayodd,
					weekend_delaytime - weekday_delaytime,
					weekend_expectdelaytime - weekday_expectdelaytime);
		}
		D.p("DELAY ODDS");
	}

	public static void main(String args[]) {
		String input = "O:/unix/projects/pardosa/data17/clzhang/datavisual/flight";
		// showmecolumnname(input);
		 arr_delay2day_of_week(input);
		// arr_delay_notweather2day_of_week(input);
		// arr_day2day_of_week_byweek(input);
		// arr_day2day_of_week_bycarrier(input);
//		thursday_rest_byweek(input);

	}
}

