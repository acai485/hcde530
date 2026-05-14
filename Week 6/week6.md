Chart Justifications

---1: Movie title counts by genre and streaming service---

A heatmap fits this question because there are two categorical variables (genre and streaming service) and there is one numeric outcome (how many distinct movie titles fall in each pair). Color intensity makes it easy to see where the sample is dense or sparse without stacking dozens of genres into one bar per service. Sorting rows and columns by volume keeps the busiest genres and services in view, which supports a quick answer to “where do titles concentrate?”

---2: Within each service, how are sample titles split by genre?---

100% stacked horizontal bars are appropriate when the question is composition within each service. Each bar is forced to 100%, so we can compare relative genre mix on a level playing field even if some services have far more titles than others in the sample. This chart supplements the heatmap by showing the relative distribution pertaining to each service.

---3: Which genre has the highest TMDB rating on each service?---

A horizontal bar chart is a strong choice because the comparison is one numeric value per category (mean TMDB rating for the winning genre on each service). Bars make rank and magnitude easy to read at a glance, and putting services on the vertical axis leaves room for long provider names. Color encodes which genre won, while hover carries how many titles that mean is based on, which matters because small counts make averages unstable.


-----------------------------------------------------------------------------------------------------------------------------
Competency Claims

---C3: Data cleaning and file handling---
This week I called the TMDB API to gather data about the different genre distributions and ratings of popular movies as well as information about their correlating availbility on streaming services. In order to prepare my data for data visualization, I had to increase the amount of data that the code would parse through in order for the visualizations to be actually insightful. I added a loop to increase the code's ability and range to look through the data.

---C6: Data visualization---
Using Plotly, I created three visualizations tied to my research questions: a heatmap for title counts by genre and service, stacked bars for within-service genre mix, and horizontal bars for the highest mean-rated genre per service. One chart was added later to make the “mix” question easier to read than a percentage heatmap alone. I had to adjust many elements of the visualizations to make them more readable and relevant to my inquiries.


