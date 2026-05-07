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
    int choice;
    float shFactor;

    cout << "Enter 3 vertices of triangle (x y):" << endl;
    for (int i = 0; i < 3; i++)
    {
        cout << "Vertex " << i + 1 << ": ";
        cin >> x[i] >> y[i];
    }

    cout << "\nShearing direction:" << endl;
    cout << "1. X-shear" << endl;
    cout << "2. Y-shear" << endl;
    cout << "Choice: ";
    cin >> choice;
    cout << "Enter shearing factor: ";
    cin >> shFactor;

    // Draw original triangle in white
    outtextxy(10, 10, (char*)"2D Shearing");
    outtextxy(x[0] - 20, y[0] - 15, (char*)"Original");
    drawTriangle(x, y, WHITE);

    // Apply shearing transformation
    int nx[3], ny[3];
    for (int i = 0; i < 3; i++)
    {
        if (choice == 1)
        {
            // X-shear: x' = x + shx * y, y' = y
            nx[i] = (int)(x[i] + shFactor * y[i]);
            ny[i] = y[i];
        }
        else
        {
            // Y-shear: x' = x, y' = y + shy * x
            nx[i] = x[i];
            ny[i] = (int)(y[i] + shFactor * x[i]);
        }
    }

    // Draw sheared triangle in magenta
    outtextxy(nx[0] - 20, ny[0] - 15, (char*)"Sheared");
    drawTriangle(nx, ny, MAGENTA);

    getch();
    closegraph();
    return 0;
}
