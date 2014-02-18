REPORT=proposal
LATEX=pdflatex
BIBTEX=bibtex

SRCS=$(REPORT).tex
REFS=$(REPORT).bib general.bib
FIGS=$(wildcard figures/*)

all: $(REPORT).pdf

$(REPORT).pdf: $(SRCS) $(REFS) $(FIGS) 
	$(LATEX) $(REPORT)
	$(BIBTEX) $(REPORT)
	$(LATEX) $(REPORT)
	$(LATEX) $(REPORT)

clean:
	rm -f *~ *.dvi *.aux *.log *.blg *.bbl $(REPORT).ps $(REPORT).pdf
