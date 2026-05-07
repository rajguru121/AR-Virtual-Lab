#include <graphics.h>
#include <conio.h>
#include <math.h>
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
    float angle;
    int px, py;

    cout << "Enter 3 vertices of triangle (x y):" << endl;
    for (int i = 0; i < 3; i++)
    {
        cout << "Vertex " << i + 1 << ": ";
        cin >> x[i] >> y[i];
    }

    cout << "Enter pivot point (px py): ";
    cin >> px >> py;
    cout << "Enter rotation angle (degrees): ";
    cin >> angle;

    // Draw original triangle in white
    outtextxy(10, 10, (char*)"2D Rotation");
    outtextxy(x[0] - 20, y[0] - 15, (char*)"Original");
    drawTriangle(x, y, WHITE);

    // Mark pivot point
    setcolor(RED);
    circle(px, py, 3);
    outtextxy(px + 5, py + 5, (char*)"Pivot");

    // Convert angle to radians
    float rad = angle * M_PI / 180.0;

    // Apply rotation: x' = px + (x-px)*cos - (y-py)*sin
    //                 y' = py + (x-px)*sin + (y-py)*cos
    int nx[3], ny[3];
    for (int i = 0; i < 3; i++)
    {
        nx[i] = px + (int)((x[i] - px) * cos(rad) - (y[i] - py) * sin(rad));
        ny[i] = py + (int)((x[i] - px) * sin(rad) + (y[i] - py) * cos(rad));
    }

    // Draw rotated triangle in green
    outtextxy(nx[0] - 20, ny[0] - 15, (char*)"Rotated");
    drawTriangle(nx, ny, GREEN);

    getch();
    closegraph();
    return 0;
}
