#include <graphics.h>
#include <conio.h>
#include <iostream>
using namespace std;

// Flood Fill Algorithm (4-connected)
void floodFill(int x, int y, int fillColor, int oldColor)
{
    // Boundary check
    if (x < 0 || x >= getmaxx() || y < 0 || y >= getmaxy())
        return;

    // Check if current pixel matches the target color
    int currentColor = getpixel(x, y);
    if (currentColor != oldColor || currentColor == fillColor)
        return;

    // Fill current pixel
    putpixel(x, y, fillColor);

    // Recursively fill 4-connected neighbors
    floodFill(x + 1, y, fillColor, oldColor);
    floodFill(x - 1, y, fillColor, oldColor);
    floodFill(x, y + 1, fillColor, oldColor);
    floodFill(x, y - 1, fillColor, oldColor);
}

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    outtextxy(10, 10, (char*)"Flood Fill Algorithm");

    // Draw a closed shape to fill
    setcolor(WHITE);
    rectangle(200, 150, 400, 350);

    // Draw an inner shape
    circle(300, 250, 50);

    outtextxy(200, 130, (char*)"Click inside the rectangle to fill");

    // Get seed point from user
    int seedX, seedY;
    cout << "Enter seed point inside shape (x y): ";
    cin >> seedX >> seedY;

    // Get the color at seed point before filling
    int oldColor = getpixel(seedX, seedY);

    // Apply flood fill with green color
    floodFill(seedX, seedY, GREEN, oldColor);

    outtextxy(10, getmaxy() - 30, (char*)"Flood fill complete!");

    getch();
    closegraph();
    return 0;
}
