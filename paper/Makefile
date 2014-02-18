REPORT=paper
LATEX=pdflatex
BIBTEX=bibtex
EXTRA_BIBS=general.bib

SRCS=$(REPORT).tex
REFS=$(REPORT).bib $(EXTRA_BIBS)
FIGS=$(wildcard figures/*)

all: $(REPORT).pdf

$(REPORT).pdf: $(SRCS) $(REFS) $(FIGS) 
	$(LATEX) $(REPORT)
	$(BIBTEX) $(REPORT)
	$(LATEX) $(REPORT)
	$(LATEX) $(REPORT)

clean:
	rm -f *~ *.dvi *.aux *.log *.blg *.bbl $(REPORT).ps $(REPORT).pdf
