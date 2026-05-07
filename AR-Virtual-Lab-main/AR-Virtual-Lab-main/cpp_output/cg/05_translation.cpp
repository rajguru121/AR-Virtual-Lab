#include <graphics.h>
#include <conio.h>
#include <iostream>
using namespace std;

// Draw a triangle given 3 vertices
void drawTriangle(int x[], int y[], int color)
{
    setcolor(color);
    line(x[0], y[0], x[1], y[1]);
    line(x[1], y[1], x[2], y[2]);
    line(x[2], y[2], x[0], y[0]);
}

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    int x[3], y[3];
    int tx, ty;

    cout << "Enter 3 vertices of triangle (x y):" << endl;
    for (int i = 0; i < 3; i++)
    {
        cout << "Vertex " << i + 1 << ": ";
        cin >> x[i] >> y[i];
    }

    cout << "Enter translation factor (tx ty): ";
    cin >> tx >> ty;

    // Draw original triangle in white
    outtextxy(10, 10, (char*)"2D Translation");
    outtextxy(x[0] - 20, y[0] - 15, (char*)"Original");
    drawTriangle(x, y, WHITE);

    // Apply translation: x' = x + tx, y' = y + ty
    int nx[3], ny[3];
    for (int i = 0; i < 3; i++)
    {
        nx[i] = x[i] + tx;
        ny[i] = y[i] + ty;
    }

    // Draw translated triangle in yellow
    outtextxy(nx[0] - 20, ny[0] - 15, (char*)"Translated");
    drawTriangle(nx, ny, YELLOW);

    getch();
    closegraph();
    return 0;
}
